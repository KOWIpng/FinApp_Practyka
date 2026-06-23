const db = require('../db');

async function getAllOperationTypes(req, res) {
    try {
        const operationTypes = await db.getAllOperationTypes();
        res.json(operationTypes);
    } catch (err) {
        console.log(err.toString());
        res.status(500).send('Помилка отримання типів операцій');
    }
}

async function createOperationType(req, res) {
    try {
        const { direction, name } = req.body;
        const operationTypeId = await db.createOperationType(direction, name);
        res.send(`Тип операції створений з ID: ${operationTypeId}`);
    } catch (err) {
        console.log(err.toString());
        res.status(500).send('Помилка створення типу операції');
    }
}

module.exports = { getAllOperationTypes, createOperationType };
