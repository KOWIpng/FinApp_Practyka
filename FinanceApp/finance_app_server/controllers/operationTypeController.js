// ТАБЛИЦІ OperationTypes БІЛЬШЕ НЕМАЄ В БАЗІ ДАНИХ!
// Цей контролер залишено лише як заглушку, щоб не зламати старий код фронтенду.

async function getAllOperationTypes(req, res) {
    try {
        // Повертаємо статичний масив замість запиту в базу
        const staticTypes = [
            { code: 1, direction: 'income', name: 'Дохід' },
            { code: 2, direction: 'expense', name: 'Витрата' }
        ];
        res.json(staticTypes);
    } catch (err) {
        console.error("Помилка getAllOperationTypes:", err.toString());
        res.status(500).json({ message: 'Помилка отримання типів операцій' });
    }
}

// Функцію createOperationType я прибрав, бо тепер типи зашиті жорстко.

module.exports = { getAllOperationTypes };