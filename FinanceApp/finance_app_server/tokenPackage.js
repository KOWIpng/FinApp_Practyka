const jwt = require('jsonwebtoken');
const db = require('./db');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).send('Відсутній токен');

    jwt.verify(token, 'secret_for_token', (err, user) => {
        if (err) return res.status(403).json({'message': 'Недійсний токен'});
        if (db.isTokenInvalid(token)) {
            console.log(db.isTokenInvalid(token));
            return res.status(403).json({'message': 'Користувач не авторизований'});
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;