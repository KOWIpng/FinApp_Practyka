const db = require('../db');
const bcrypt = require('bcrypt');

async function register(req, res) {
    try {
        // initialCapital та savings поки що не використовуються в db.js, але залишаємо
        const { name, password, initialCapital, savings } = req.body; 
        
        const userId = await db.createUser(name, password);
        const user = await db.getUserByName(name);
        const token = await db.generateToken(user);
        
        // Відправляємо ВСЕ в одному об'єкті
        res.json({ 
            id: user.code, 
            name: user.name, 
            token: token,
            message: `Користувач створений з ID: ${userId}`
        });
    } catch (err) {
        console.log("Помилка реєстрації:", err.toString());
        res.status(500).json({"message": "Помилка реєстрації"});
    }
}

async function login(req, res) {
    try {
        const { name, password } = req.body;
        const user = await db.getUserByName(name);
        
        if (user) {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (isValidPassword) {
                const token = await db.generateToken(user);
                res.json({ token: token });
            } else {
                res.status(401).json({ "message": "Неправильний пароль" });
            }
        } else {
            res.status(401).json({"message": "Користувача не знайдено"});
        }
    } catch (err) {
        console.log("Помилка логіну:", err.toString());
        res.status(500).json({"message": "Помилка авторизації"});
    }
}

async function logout(req, res) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            await db.cancelToken(token);
            res.status(200).json({"message": "Ви вийшли з системи"});
        } else {
            res.status(401).json({"message": "Відсутній токен"});
        }
    } catch (err) {
        console.log("Помилка logout:", err.toString());
        res.status(500).json({"message": "Помилка logout"});
    }
}

module.exports = { register, login, logout };
