-- ==========================================
-- 1. ТОТАЛЬНЕ ОЧИЩЕННЯ (ЗНОСИМО ВСЕ)
-- ==========================================
DROP VIEW IF EXISTS vINCvsEXP CASCADE;
DROP VIEW IF EXISTS vUserFullInfo CASCADE;
DROP VIEW IF EXISTS vLimitsState CASCADE;
DROP VIEW IF EXISTS vOperations CASCADE;
DROP VIEW IF EXISTS vCategories CASCADE;

DROP TABLE IF EXISTS BankTokens CASCADE;
DROP TABLE IF EXISTS Savings CASCADE;
DROP TABLE IF EXISTS Operations CASCADE;
DROP TABLE IF EXISTS Limits CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS OperationTypes CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- ==========================================
-- 2. СТВОРЕННЯ ЧИСТОЇ БАЗИ
-- ==========================================

-- Таблиця користувачів
CREATE TABLE Users (
    code SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Таблиця Лімітів (твої бюджети)
CREATE TABLE Limits (
    code SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, 
    user_id INTEGER NOT NULL,
    target DECIMAL(10,2) NOT NULL DEFAULT 0, 
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE
);

-- Таблиця операцій (транзакції)
CREATE TABLE Operations (
    code SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    Limit_id INTEGER, 
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UAH',
    category VARCHAR(255) NOT NULL, 
    description TEXT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')), 
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE,
    FOREIGN KEY (Limit_id) REFERENCES Limits(code) ON DELETE SET NULL
);

-- Таблиця накопичень (цілі)
CREATE TABLE Savings (
    code SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    target DECIMAL(10,2) NOT NULL,
    current DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(code) ON DELETE CASCADE
);

-- Таблиця для банківських токенів
CREATE TABLE BankTokens (
    userid INTEGER PRIMARY KEY,
    token TEXT,
    FOREIGN KEY (userid) REFERENCES Users(code) ON DELETE CASCADE
);

-- ==========================================
-- 3. ПРЕДСТАВЛЕННЯ (VIEWS)
-- ==========================================

-- В'юха для операцій (підтягує назву ліміту)
CREATE OR REPLACE VIEW vOperations AS
SELECT
    o.code AS Operation_code,
    o.user_id AS User_ID,
    o.date AS Operation_date,
    o.category AS Operation_category,
    l.name AS Limit_name,
    o.amount AS Amount,
    o.currency AS Currency,
    o.description AS Operation_description,
    o.type AS Operation_direction
FROM Operations o
LEFT JOIN Limits l ON o.Limit_id = l.code;

-- В'юха МАГІЧНИХ ЛІМІТІВ (залишок на поточний місяць)
CREATE OR REPLACE VIEW vLimitsState AS
SELECT 
    l.code AS limit_code,
    l.user_id,
    l.name AS limit_name,
    l.target,
    COALESCE(SUM(o.amount), 0) AS spent_this_month,
    (l.target - COALESCE(SUM(o.amount), 0)) AS current_remaining
FROM Limits l
LEFT JOIN Operations o 
    ON l.code = o.Limit_id 
    AND EXTRACT(MONTH FROM o.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM o.date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY l.code, l.user_id, l.name, l.target;

-- В'юха для аналізу доходів vs витрат
CREATE OR REPLACE VIEW vINCvsEXP AS
SELECT
    user_id,
    type AS direction,
    SUM(amount) as total_amount,
    COUNT(*) as operation_count
FROM Operations
GROUP BY user_id, type;

-- В'юха для повної інформації про користувача
CREATE VIEW vUserFullInfo AS
SELECT 
    u.code AS user_id,
    u.name AS user_name,
    -- Загальний баланс (всі доходи мінус всі витрати)
    COALESCE((SELECT SUM(amount) FROM Operations WHERE user_id = u.code AND type = 'income'), 0) - 
    COALESCE((SELECT SUM(amount) FROM Operations WHERE user_id = u.code AND type = 'expense'), 0) AS total_capital,
    
    -- Дельта поточного місяця (доходи цього місяця мінус витрати цього місяця)
    COALESCE((SELECT SUM(amount) FROM Operations WHERE user_id = u.code AND type = 'income' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) - 
    COALESCE((SELECT SUM(amount) FROM Operations WHERE user_id = u.code AND type = 'expense' AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS current_month,
    
    -- Сума у скарбничках
    COALESCE((SELECT SUM(current) FROM Savings WHERE user_id = u.code), 0) AS total_savings
FROM Users u;

-- ==========================================
-- 4. ТРИГЕРИ
-- ==========================================

-- Функція для автоматичного поповнення накопичень 
-- (Додає суму до Savings, якщо операція прив'язана до користувача)
CREATE OR REPLACE FUNCTION update_savings_after_operation()
RETURNS TRIGGER AS $$
BEGIN
    -- Оновлюємо накопичення тільки якщо це дохід (income) і є вільні кошти
    -- Тут можна налаштувати логіку так, як ти хочеш, щоб працювали твої скарбнички
    IF NEW.type = 'income' THEN
        UPDATE Savings
        SET current = current + NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_savings_after_operation
AFTER INSERT ON Operations
FOR EACH ROW
EXECUTE FUNCTION update_savings_after_operation();