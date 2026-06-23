const db = require('../db');
const {generateToken} = require("../db");
const bcrypt = require('bcrypt');

async function register(req, res) {
    try {
        const { name, password, initialCapital, savings } = req.body;
        const userId = await db.createUser(name, password);
        const user = await db.getUserByName(name);
        const token = await db.generateToken(user);
        res.json({ id: user.code, name: user.name, token });
        res.json({"message": `Користувач створений з ID: ${userId}`});
    } catch (err) {
        console.log(err.toString());
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
                res.status(401).json({ "message": "Неправильний логін або пароль" });
            }
        } else {
            res.status(401).json({"message": "Неправильний логін або пароль"});
        }
    } catch (err) {
        console.log(err.toString());
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
        res.status(500).json({"message": "Помилка logout"});
    }
}

module.exports = { register, login, logout };
