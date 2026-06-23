const db = require('../db');

async function getAllOperationTypes(req, res) {
    try {
        const operationTypes = await db.getAllOperationTypes();
        res.json(operationTypes);
    } catch (err) {
        console.error("Помилка getAllOperationTypes:", err.toString());
        res.status(500).json({ message: 'Помилка отримання типів операцій' });
    }
}

async function createOperationType(req, res) {
    try {
        const { direction, name } = req.body;
        const operationTypeId = await db.createOperationType(direction, name);
        res.status(201).json({ 
            message: `Тип операції створений`, 
            id: operationTypeId 
        });
    } catch (err) {
        console.error("Помилка createOperationType:", err.toString());
        res.status(500).json({ message: 'Помилка створення типу операції' });
    }
}

module.exports = { getAllOperationTypes, createOperationType };
