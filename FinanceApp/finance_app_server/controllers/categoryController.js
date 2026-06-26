const db = require('../db');

async function getAllCategories(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит лімітів (категорій) для користувача ', userId);
        const categories = await db.getAllCategories(userId);
        res.json(categories);
    } catch (err) {
        console.error("Помилка getAllCategories:", err.toString());
        res.status(500).json({ message: 'Помилка отримання категорій' });
    }
}

async function createCategory(req, res) {
  try {
    // ОНОВЛЕНО: замість direction тепер використовуємо target (стартовий ліміт)
    const { name, userId, target } = req.body;
    console.log('Створення ліміту:', name, userId, target);
    
    // Якщо target не передали з фронтенду, ставимо 0
    const categoryId = await db.createCategory(name, userId, target || 0);
    res.status(201).json({ success: true, categoryId });
  } catch (err) {
    console.error('❌ Помилка створення категорії:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function setCategoryTarget(req, res) {
  const { categoryId, target, userId } = req.body;
  console.log("Оновлення ліміту:", req.body);
  try {
    await db.setCategoryTarget(categoryId, userId, target);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Помилка оновлення ліміту:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteCategory(req, res) {
    const { categoryId, userId } = req.body;
    console.log("Видалення ліміту:", req.body);
    try {
        await db.deleteCategory(categoryId, userId);
        res.json({ success: true })
    } catch (err) {
        console.error('❌ Помилка видалення ліміту:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getAllCategories, createCategory, setCategoryTarget, deleteCategory };