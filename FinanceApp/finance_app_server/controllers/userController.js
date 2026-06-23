const db = require('../db');

async function getUserInfo(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит інформації для користувача ', userId);
        const users = await db.getUserInfo(userId);
        res.json(users);
    } catch (err) {
        console.log(err.toString());
        res.status(500).json({ "message": "Помилка отримання даних" });
    }
}

module.exports = { getUserInfo };
