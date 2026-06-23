-- Створення таблиці користувачів
CREATE TABLE IF NOT EXISTS Users (
    code INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Створення таблиці типів операцій
CREATE TABLE IF NOT EXISTS OperationTypes (
    code INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL CHECK (direction IN ('income', 'expense')),
    name TEXT NOT NULL
);

-- Створення таблиці категорій
CREATE TABLE IF NOT EXISTS Categories (
    code INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(code)
);

-- Створення таблиці операцій
CREATE TABLE IF NOT EXISTS Operations (
    code INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'UAH',
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(code),
    FOREIGN KEY (category_id) REFERENCES Categories(code)
);

-- Створення таблиці накопичень
CREATE TABLE IF NOT EXISTS Savings (
    code INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    target DECIMAL(10,2) NOT NULL,
    current DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(code)
);

-- Створення представлення для операцій з додатковою інформацією
CREATE VIEW IF NOT EXISTS vOperations AS
SELECT 
    o.code AS Operation_code,
    o.user_id AS User_ID,
    o.date AS Operation_date,
    c.name AS Operation_category,
    o.amount AS Amount,
    o.currency AS Currency,
    o.description AS Operation_description,
    t.direction AS Operation_direction
FROM Operations o
JOIN Categories c ON o.category_id = c.code
JOIN OperationTypes t ON t.code = c.code;

-- Створення представлення для категорій з додатковою інформацією
CREATE VIEW IF NOT EXISTS vCategories AS
SELECT 
    c.code AS Category_code,
    c.name AS Category_name,
    c.user_id AS user_id,
    t.direction AS Category_direction
FROM Categories c
JOIN OperationTypes t ON t.code = c.code;

-- Створення представлення для повної інформації про користувача
CREATE VIEW IF NOT EXISTS vUserFullInfo AS
SELECT 
    u.code AS user_id,
    u.name AS user_name,
    COUNT(DISTINCT o.code) AS total_operations,
    COUNT(DISTINCT s.code) AS total_savings
FROM Users u
LEFT JOIN Operations o ON u.code = o.user_id
LEFT JOIN Savings s ON u.code = s.user_id
GROUP BY u.code, u.name;

-- Створення представлення для аналізу доходів vs витрат
CREATE VIEW IF NOT EXISTS vINCvsEXP AS
SELECT 
    o.user_id,
    t.direction,
    SUM(o.amount) as total_amount,
    COUNT(*) as operation_count
FROM Operations o
JOIN Categories c ON o.category_id = c.code
JOIN OperationTypes t ON t.code = c.code
GROUP BY o.user_id, t.direction;

-- Вставка базових типів операцій
INSERT INTO OperationTypes (direction, name) VALUES
('income', 'Зарплата'),
('income', 'Підробіток'),
('income', 'Інвестиції'),
('income', 'Інше'),
('expense', 'Продукти'),
('expense', 'Комунальні послуги'),
('expense', 'Транспорт'),
('expense', 'Розваги'),
('expense', 'Одяг'),
('expense', 'Здоров''я'),
('expense', 'Інше');

-- Створення тригера для автоматичного оновлення накопичень
CREATE TRIGGER IF NOT EXISTS update_savings_after_operation
AFTER INSERT ON Operations
BEGIN
    UPDATE Savings 
    SET current = current + NEW.amount 
    WHERE user_id = NEW.user_id 
    AND NEW.category_id IN (
        SELECT code 
        FROM Categories 
        WHERE user_id = NEW.user_id
    );
END; 