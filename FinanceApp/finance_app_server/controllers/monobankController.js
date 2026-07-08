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
        const from = req.params.from;
        const to = req.params.to;
        
        console.log(`=== Синхронізація з Monobank для користувача ${userId} ===`);

       
        const token = await db.getBankToken(userId);
        if (!token) {
            console.log(" Токен відсутній для користувача", userId);
            return res.status(401).json({ message: 'Токен доступу не знайдено' });
        }

        // URL запиту до monobank API
        const ACCOUNT_ID = 0; // аккаунт за замовчуванням
        let url = `https://api.monobank.ua/personal/statement/${ACCOUNT_ID}/${from}/`;
        if (to && to !== "") {
            url += `${to}`;
        }
        console.log("🔗 Запит до банку:", url);

        // запит до API monobank
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Token': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Помилка від monobank API:', response.status, errorText);
            return res.status(response.status).json({ message: 'Помилка отримання транзакцій від банку' });
        }

        const bankTransactions = await response.json();

        // Якщо транзакцій немає, порожній масив
        if (!bankTransactions || bankTransactions.length === 0) {
            console.log("Немає нових транзакцій за цей період.");
            return res.json([]);
        }

        console.log(` Отримано ${bankTransactions.length} транзакцій від Monobank. Починаємо ШІ-аналіз...`);

        // Отримує поточні ліміти користувача з БД
        const userLimits = await db.getAllCategories(userId);
        const mappedLimits = userLimits.map(c => ({ id: c.code, name: c.name }));

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