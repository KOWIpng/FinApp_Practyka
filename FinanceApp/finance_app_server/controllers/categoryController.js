const db = require('../db');

async function getAllCategories(req, res) {
    try {
        const userId = req.params.userId;
        console.log('Запит категорій для користувача ', userId);
        const categories = await db.getAllCategories(userId);
        res.json(categories);
    } catch (err) {
        console.log(err.toString());
        res.status(500).send('Помилка отримання категорій');
    }
}

async function createCategory(req, res) {
  try {
    const { name, userId, direction } = req.body;
    console.log('Створення категорії:', name, userId, direction);
    const categoryId = await db.createCategory(name, userId, direction);
    res.status(201).json({ success: true, categoryId });
  } catch (err) {
    console.error('❌ Помилка створення категорії:', err);
    res.status(500).json({ success: false, message: err.message }); // ← повертаємо JSON
  }
}

async function setCategoryTarget(req, res) {
  const { categoryId, target, userId } = req.body;
  console.log("оновлення категорії =  ", req.body);
  try {
    await db.setCategoryTarget(categoryId, userId, target);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteCategory(req, res) {
    const {categoryId, userId} =req.body;
    console.log("видалення категорії =  ", req.body);
    try {
        await db.deleteCategory(categoryId, userId);
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
    
}



module.exports = { getAllCategories, createCategory, setCategoryTarget, deleteCategory};
