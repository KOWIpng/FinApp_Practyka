-- Створення таблиці користувачів
CREATE TABLE IF NOT EXISTS Users (
    code SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Створення таблиці типів операцій
CREATE TABLE IF NOT EXISTS OperationTypes (
    code SERIAL PRIMARY KEY,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('income', 'expense')),
    name VARCHAR(255) NOT NULL
);

-- Створення таблиці категорій
-- (Додано direction та target, оскільки вони є у файлі db.js)
CREATE TABLE IF NOT EXISTS Categories (
    code SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER,
    direction VARCHAR(50),
    target DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE
);

-- Створення таблиці операцій
CREATE TABLE IF NOT EXISTS Operations (
    code SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UAH',
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(code) ON DELETE CASCADE
);

-- Створення таблиці накопичень
CREATE TABLE IF NOT EXISTS Savings (
    code SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    target DECIMAL(10,2) NOT NULL,
    current DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE
);

-- Створення таблиці для банківських токенів (з db.js)
CREATE TABLE IF NOT EXISTS BankTokens (
    userid INTEGER PRIMARY KEY,
    token TEXT,
    FOREIGN KEY (userid) REFERENCES Users(code) ON DELETE CASCADE
);

-- Створення представлення для операцій з додатковою інформацією
CREATE OR REPLACE VIEW vOperations AS
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
CREATE OR REPLACE VIEW vCategories AS
SELECT 
    c.code AS Category_code,
    c.name AS Category_name,
    c.user_id AS user_id,
    t.direction AS Category_direction
FROM Categories c
JOIN OperationTypes t ON t.code = c.code;

-- Створення представлення для повної інформації про користувача
CREATE OR REPLACE VIEW vUserFullInfo AS
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
CREATE OR REPLACE VIEW vINCvsEXP AS
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

-- Створення функції для тригера
CREATE OR REPLACE FUNCTION update_savings_after_operation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Savings 
    SET current = current + NEW.amount 
    WHERE user_id = NEW.user_id 
    AND NEW.category_id IN (
        SELECT code 
        FROM Categories 
        WHERE user_id = NEW.user_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Видалення старого тригера (якщо він раптом існував)
DROP TRIGGER IF EXISTS trg_update_savings_after_operation ON Operations;

-- Створення самого тригера
CREATE TRIGGER trg_update_savings_after_operation
AFTER INSERT ON Operations
FOR EACH ROW
EXECUTE FUNCTION update_savings_after_operation();