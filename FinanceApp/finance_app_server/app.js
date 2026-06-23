const express = require('express');
const cors = require('cors');
const authenticateToken = require("./tokenPackage");
const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());

app.use('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Ви авторизовані!' });
});

// Підключення маршрутів
const authRoutes = require('./routes/authRoutes');
const operationRoutes = require('./routes/operationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const operationTypeRoutes = require('./routes/operationTypeRoutes');
const savingsRoutes = require('./routes/savingRoutes');
const usersRoutes = require('./routes/userRoutes');
const reportsRoutes = require('./routes/reportRoutes');
const monobankRoutes = require('./routes/monobankRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/operations', authenticateToken, operationRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/operation-types', authenticateToken, operationTypeRoutes);
app.use('/api/savings', authenticateToken, savingsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/monobank', authenticateToken, monobankRoutes);

app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});
