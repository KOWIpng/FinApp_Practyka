const db = require('../db');
const XLSX = require('xlsx');

async function getAllOperations(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит операцій для користувача ', userId);
        const operations = await db.getAllOperations(userId);
        res.json(operations);
    } catch (err) {
        console.log(err.toString());
        res.status(500).send('Помилка отримання операцій');
    }
}

async function createOperation(req, res) {
    try {
        const { userId, date, categoryId, amount, currency, description } = req.body;
        const operationId = await db.createOperation(userId, date, categoryId, amount, currency, description);
        res.json({'operation_id': operationId});
    } catch (err) {
        console.log(err.toString());
        res.status(500).json({'message': 'Помилка створення операції'});    }
}

async function exportTransactions(req, res) {
  const userId = req.user.id;

   try {
        console.log('експорт операцій для користувача ', userId);
        const operations = await db.getAllOperations(userId);
         const worksheet = XLSX.utils.json_to_sheet(operations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Транзакції');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
    } catch (err) {
        console.log(err.toString());
        res.status(500).send('Помилка експорту операцій');
    }


  };


module.exports = { getAllOperations, createOperation, exportTransactions };
