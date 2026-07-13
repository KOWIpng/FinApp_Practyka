const db = require('../db');
const aiService = require('./aiService'); 

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
        
        console.log("🔗 Запит до банку:", url);

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

        // Якщо транзакцій немає, порожній масив
        if (!bankTransactions || bankTransactions.length === 0) {
            console.log("Немає нових транзакцій за цей період.");
            return res.json([]);
        }

        console.log(` Отримано ${bankTransactions.length} транзакцій від Monobank. Починаємо ШІ-аналіз...`);

        // Отримує поточні ліміти користувача з БД
        const userLimits = await db.getAllCategories(userId);
        console.log("ліміти з БД:", userLimits);
        const mappedLimits = userLimits.map(c => ({ 
            id: c.limit_code, 
            name: c.limit_name 
        }));

        const enrichedTransactions = [];

        // прогін транзакцій через ші
        for (const tx of bankTransactions) {
            console.log(`\n🔮 Аналізуємо: "${tx.description}" (Сума: ${tx.amount / 100} UAH)`);
            
            const aiResult = await aiService.categorizeTransaction(tx.description, mappedLimits);
            
            // Додаємо результати ШІ до оригінальної транзакції банку
            enrichedTransactions.push({
                ...tx, // Копіюємо всі оригінальні поля (id, time, description, amount, mcc тощо)
                aiCategory: aiResult.category, // Розпізнана текстом категорія 
                aiLimitId: aiResult.limitId    // ID ліміту користувача 
            });
        }

        console.log(" Усі транзакції успішно проаналізовано та відправлено на фронтенд.");
        
        // Відправляємо збагачені транзакції у відповідь
        res.json(enrichedTransactions);

    } catch (err) {
        console.error(" Помилка getTransactions:", err.toString());
        res.status(500).json({ message: 'Помилка отримання даних' });
    }
}

module.exports = { getTransactions, setToken };