const db = require('../db');

async function getAllSavings(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит накопичень для користувача ', userId);
        const savings = await db.getAllSavings(userId);
        res.json(savings);
    } catch (err) {
        console.error("Помилка getAllSavings:", err.toString());
        res.status(500).json({ "message": "Помилка отримання накопичень" });
    }
}

async function createSavings(req, res) {
    try {
        const { title, target, current = 0 } = req.body;
        const userId = req.params.userId;
        await db.createSavings(userId, title, target, current);
        res.status(201).json({ "message": "Накопичення створено" });
    } catch (err) {
        console.error("Помилка createSavings:", err.toString());
        res.status(500).json({ "message": "Помилка створення накопичення" });
    }
}

async function updateSavings(req, res) {
    try {
        const { amount } = req.body;
        const code = req.params.code;
        await db.updateSavings(code, amount);
        res.json({ "message": "Накопичення оновлено" });
    } catch (err) {
        console.error("Помилка updateSavings:", err.toString());
        res.status(500).json({ "message": "Помилка оновлення накопичення" });
    }
}

async function deleteSavings(req, res) {
    try {
        const code = req.params.code;
        await db.deleteSavings(code);
        res.json({ "message": "Накопичення видалено" });
    } catch (err) {
        console.error("Помилка deleteSavings:", err.toString());
        res.status(500).json({ "message": "Помилка видалення накопичення" });
    }
}

module.exports = { getAllSavings, createSavings, updateSavings, deleteSavings };
