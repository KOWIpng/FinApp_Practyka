const db = require('../db');

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
        
        console.log('Синхронізація з Monobank для користувача ', userId);

        // Отримуємо токен користувача з бази
        const token = await db.getBankToken(userId);
        if (!token) {
            console.log("Токен відсутній для користувача", userId);
            return res.status(401).json({ message: 'Токен доступу не знайдено' });
        }

        // Формуємо URL запиту до monobank API
        const ACCOUNT_ID = 0; // аккаунт за замовчуванням
        let url = `https://api.monobank.ua/personal/statement/${ACCOUNT_ID}/${from}/`;
        if (to && to !== "") {
            url += `${to}`;
        }
        console.log("Запит до банку:", url);

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
            console.error('❌ Помилка від monobank API:', response.status, errorText);
            return res.status(response.status).json({ message: 'Помилка отримання транзакцій від банку' });
        }

        const bankTransactions = await response.json();

        // Відправляємо отримані транзакції у відповідь
        res.json(bankTransactions);

    } catch (err) {
        console.error("Помилка getTransactions:", err.toString());
        res.status(500).json({ message: 'Помилка отримання даних' });
    }
}

module.exports = { getTransactions, setToken };
