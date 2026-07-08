const db = require('../db');
const XLSX = require('xlsx');

async function getAllOperations(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит операцій для користувача', userId);
        const operations = await db.getAllOperations(userId);
        res.json(operations);
    } catch (err) {
        console.error("Помилка getAllOperations:", err.toString());
        res.status(500).json({ message: 'Помилка отримання операцій' });
    }
}

async function createOperation(req, res) {
    try {
        console.log("📥 Прийшли дані з фронтенду:", req.body); // Одразу побачимо, де губиться сума
        
        const { userId, date, limitId, amount, currency, category, description, type } = req.body;
        
        // Якщо сума не прийшла або вона null — відбиваємо запит ще до бази
        if (amount === undefined || amount === null) {
            console.error(" Помилка: сума (amount) відсутня у запиті!");
            return res.status(400).json({ message: 'Сума обов\'язкова' });
        }

        const operationId = await db.createOperation(
            userId, date, limitId, amount, currency, category, description, type
        );
        res.status(201).json({ operation_id: operationId });
    } catch (err) {
        console.error("Помилка createOperation:", err.toString());
        res.status(500).json({ message: 'Помилка створення операції' });
    }
}

async function exportTransactions(req, res) {
    const userId = req.user.id;

    try {
        console.log('Експорт операцій для користувача', userId);
        const operations = await db.getAllOperations(userId);
        
        const worksheet = XLSX.utils.json_to_sheet(operations);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Транзакції');

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error("Помилка експорту операцій:", err.toString());
        res.status(500).json({ message: 'Помилка експорту операцій' });
    }
}

module.exports = { getAllOperations, createOperation, exportTransactions };