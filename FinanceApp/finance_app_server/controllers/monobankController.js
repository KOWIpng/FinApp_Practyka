const db = require('../db');
const aiService = require('./aiService'); 

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setToken(req, res) {
    try {
        const userId = req.params.userId;
        const { token } = req.body;
        console.log('Зберігаємо токен для користувача ', userId);
        
        const result = await db.setBankToken(userId, token);
        res.json(result);
    } catch (err) {
        console.error("Помилка setToken:", err.toString());
        res.status(500).json({"message": "Помилка збереження токену"});
    }
}

async function getTransactions(req, res) {
    try {
        const userId = req.params.userId;
        const fromDate = req.params.from; 
        const toDate = req.params.to;
        
        console.log(`=== Синхронізація з Monobank для користувача ${userId} ===`);

        const token = await db.getBankToken(userId);
        if (!token) {
            return res.status(401).json({ message: 'Токен доступу не знайдено' });
        }
        
        let fromUnix;
        if (!isNaN(fromDate)) {
            fromUnix = Math.floor(Number(fromDate) / 1000);
        } else {
            fromUnix = Math.floor(new Date(fromDate).getTime() / 1000);
        }

        const ACCOUNT_ID = 0;
        let url = `https://api.monobank.ua/personal/statement/${ACCOUNT_ID}/${fromUnix}/`;

        if (toDate && toDate !== "") {
            let toUnix;
            if (!isNaN(toDate)) {
                toUnix = Math.floor(Number(toDate) / 1000);
            } else {
                toUnix = Math.floor(new Date(toDate).getTime() / 1000);
            }
            url += `${toUnix}`;
        }
        
        console.log(" Запит до банку:", url);

        // Виконуємо запит до API monobank
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Token': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(' Помилка від monobank API:', response.status, errorText);
            return res.status(response.status).json({ message: 'Помилка отримання транзакцій від банку' });
        }

        const bankTransactions = await response.json();
        console.log("СИРА ВІДПОВІДЬ ВІД МОНОБАНКУ:", bankTransactions);

        // Якщо транзакцій немає, повертаємо порожній масив
        if (!bankTransactions || bankTransactions.length === 0) {
            console.log("Немає нових транзакцій за цей період.");
            return res.json([]);
        }

        console.log(` Отримано ${bankTransactions.length} транзакцій від Monobank. Починаємо ШІ-аналіз...`);

        // Отримує поточні ліміти користувача з БД
       let userLimits = await db.getAllCategories(userId);
        console.log("Ліміти з БД (сирі дані):", userLimits);

        if (userLimits && userLimits.rows) {
            userLimits = userLimits.rows;
        }

        if (!Array.isArray(userLimits)) {
            console.log("⚠️ Ліміти не є масивом або відсутні. Створюємо порожній масив.");
            userLimits = [];
        }

        const mappedLimits = userLimits.map(c => ({ 
            id: c.limit_code, 
            name: c.limit_name 
        }));

        // СЛОВНИК MCC-КОДІВ 
       const mccDict = {
            5411: "Супермаркети та продукти",
            5814: "Фастфуд (МакДональдз тощо)",
            5812: "Кафе та ресторани",
            5462: "Пекарні",
            5912: "Аптеки",
            4814: "Телекомунікації та зв'язок",
            4111: "Громадський транспорт",
            4131: "Автобуси",
            4121: "Таксі",
            5331: "Універсальні магазини (Аврора тощо)",
            4829: "Грошові перекази",
            8999: "Професійні послуги"
        };

       console.log("📦 Готуємо пачку транзакцій для ШІ...");
        
        //  Формуємо пачку для ШІ 
      const batchForAI = bankTransactions.map((tx, index) => ({
            id: String(index), 
            desc: tx.description,
            mcc: mccDict[tx.mcc] || `Невідома категорія (${tx.mcc})`,
            amount: tx.amount / 100 // Від'ємне число = витрата, додатне = дохід
        }));

        // 2. ВІДПРАВЛЯЄМО ВСЕ ОДНИМ ЗАПИТОМ
        const aiResultsArray = await aiService.categorizeTransactionsBatch(batchForAI, mappedLimits);
        
        // 🔍 РЕНТГЕН: Дивимося, що САМЕ повернув ШІ
        console.log("🤖 Відповідь ШІ (сирі дані):", aiResultsArray);

        const safeAiResults = Array.isArray(aiResultsArray) ? aiResultsArray : [];
        const processedTransactions = []; 

        // 3. Зберігаємо результати в БД
        console.log("💾 Записуємо оброблені транзакції в базу...");
        
        // Використовуємо звичайний цикл for, щоб мати доступ до індексу (i)
        for (let i = 0; i < bankTransactions.length; i++) {
            const tx = bankTransactions[i];
            
            // Шукаємо відповідь ШІ за простим номером (0, 1, 2...)
            const aiData = safeAiResults.find(r => String(r.id) === String(i)) || { category: "Без категорії", limitId: null };

            const txDate = new Date(tx.time * 1000).toISOString().split('T')[0]; 
            const txAmount = Math.abs(tx.amount) / 100; 
            const txType = tx.amount < 0 ? 'expense' : 'income';

            try {
                await db.createOperation(
                    userId,
                    txDate,
                    aiData.limitId, 
                    txAmount,
                    'UAH',
                    aiData.category,
                    tx.description,
                    txType
                );
                console.log(`Збережено: "${tx.description}" | Сума: ${txAmount} UAH | Ліміт: ${aiData.limitId}`);
            } catch (dbErr) {
                console.error(` Помилка БД:`, dbErr.message);
            }

            processedTransactions.push({
                ...tx,
                category: aiData.category,
                limitId: aiData.limitId
            });
        }
        return res.json(processedTransactions);

    } catch (err) { 
        console.error("Помилка getTransactions:", err.toString());
        res.status(500).json([]);
    }
}

module.exports = { getTransactions, setToken };