const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// підключення до бази постгрес
const pool = new Pool({
  user: "eugene",       //  користувач у Postgres
  host: "localhost",
  database: "financedbp",   //  база даних
  password: "",    
  port: 5432,       
})

const canceledTokens = new Set()


async function generateToken(user) {
  const payload = { id: user.code, name: user.name }
  return jwt.sign(payload, "secret_for_token", { expiresIn: "10m" })
}

async function cancelToken(token) {
  canceledTokens.add(token)
}

function isTokenInvalid(token) {
  return canceledTokens.has(token)
}

// ==========================================
// КОРИСТУВАЧІ
// ==========================================

async function createUser(name, password) {
  const hashedPassword = await bcrypt.hash(password, 10)
  try {
    const res = await pool.query(
      "INSERT INTO Users (name, password) VALUES ($1, $2) RETURNING code",
      [name, hashedPassword]
    )
    return res.rows[0].code
  } catch (err) {
    throw err
  }
}

async function getUserByName(name) {
  try {
    const res = await pool.query("SELECT * FROM Users WHERE name = $1", [name])
    return res.rows[0]
  } catch (err) {
    throw err
  }
}

async function getUserById(id) {
  try {
    const res = await pool.query("SELECT * FROM Users WHERE code = $1", [id])
    return res.rows[0]
  } catch (err) {
    throw err
  }
}

async function getUserInfo(userId) {
  try {
    const res = await pool.query("SELECT * FROM vUserFullInfo WHERE user_id = $1", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

// ==========================================
// ОПЕРАЦІЇ (ТРАНЗАКЦІЇ)
// ==========================================

async function getAllOperations(userId) {
  try {
    const res = await pool.query("SELECT * FROM vOperations WHERE User_ID = $1 ORDER BY Operation_date DESC", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}


async function createOperation(userId, date, limitId, amount, currency, category, description, type) {
  try {
    const res = await pool.query(
      "INSERT INTO Operations (user_id, date, Limit_id, amount, currency, category, description, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING code",
      [userId, date, limitId || null, amount, currency, category, description, type]
    )
    return res.rows[0].code
  } catch (err) {
    throw err
  }
}

// ЛІМІТИ 

async function getAllLimits(userId) {
  try {
    // Беремо дані з нашої магічної в'юхи, яка рахує залишок на цей місяць
    const res = await pool.query("SELECT * FROM vLimitsState WHERE user_id = $1 ORDER BY limit_name", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

async function createLimit(name, userId, target) {
  try {
    const res = await pool.query(
      "INSERT INTO Limits (name, user_id, target) VALUES ($1, $2, $3) RETURNING code",
      [name, userId, target || 0]
    )
    return res.rows[0].code
  } catch (err) {
    console.error('❗ Postgres помилка створення ліміту:', err);
    throw err
  }
}

async function setLimitTarget(limitId, userId, target) {
  try {
    await pool.query(
      "UPDATE Limits SET target = $1 WHERE code = $2 AND user_id = $3",
      [target, limitId, userId]
    )
    return true
  } catch (err) {
    throw err
  }
}

async function deleteLimit(limitId, userId) {
  try {
    await pool.query(
      "DELETE FROM Limits WHERE code = $1 AND user_id = $2",
      [limitId, userId]
    )
    return true
  } catch (err) {
    throw err
  }
}


// НАКОПИЧЕННЯ 


async function getAllSavings(userId) {
  try {
    const res = await pool.query("SELECT * FROM Savings WHERE user_id = $1", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

async function createSavings(userId, title, target, current) {
  try {
    const res = await pool.query(
      "INSERT INTO Savings (user_id, title, target, current) VALUES ($1, $2, $3, $4) RETURNING code",
      [userId, title, target, current]
    )
    return res.rows[0].code
  } catch (err) {
    throw err
  }
}

async function updateSavings(code, amount) {
  try {
    await pool.query("UPDATE Savings SET current = current + $1 WHERE code = $2", [amount, code])
  } catch (err) {
    throw err
  }
}

async function deleteSavings(code) {
  try {
    await pool.query("DELETE FROM Savings WHERE code = $1", [code])
  } catch (err) {
    throw err
  }
}

// ЗВІТИ 

async function getReport_incvsexp(userId, year, month) {
  let query = `
        SELECT 
            TO_CHAR(date, 'YYYY-MM') AS month,
            type AS direction,
            SUM(amount) as total_amount
        FROM Operations
        WHERE user_id = $1
    `
  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }
  if (month) {
    query += ` AND EXTRACT(MONTH FROM date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }
  query += ` GROUP BY month, type ORDER BY month`

  try {
    const res = await pool.query(query, params)
    return res.rows
  } catch (err) {
    throw err
  }
}

async function getReport_CatExp(userId, year, month) {
  let query = `
        SELECT 
            category as category_name, 
            SUM(amount) as total_amount 
        FROM Operations
        WHERE user_id = $1 AND type = 'expense'
    `
  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }
  if (month) {
    query += ` AND EXTRACT(MONTH FROM date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }
  query += ` GROUP BY category`

  try {
    const res = await pool.query(query, params)
    return res.rows
  } catch (err) {
    throw err
  }
}

async function getReport_ExpenseTrend(userId, year, month) {
  let query = `
        SELECT 
            date,
            SUM(amount) as amount
        FROM Operations
        WHERE user_id = $1 AND type = 'expense'
    `
  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }
  if (month) {
    query += ` AND EXTRACT(MONTH FROM date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }
  query += ` GROUP BY date ORDER BY date DESC LIMIT 30`

  try {
    const res = await pool.query(query, params)
    return res.rows
  } catch (err) {
    throw err
  }
}


// БАНКІВСЬКІ ТОКЕНИ


async function setBankToken(userId, token) {
  try {
    await pool.query(
      "INSERT INTO BankTokens (userid, token) VALUES ($1, $2) ON CONFLICT (userid) DO UPDATE SET token = EXCLUDED.token",
      [userId, token]
    )
    return { "message": "Токен збережено" }
  } catch (err) {
    throw err
  }
}

async function getBankToken(userId) {
  try {
    const res = await pool.query("SELECT token FROM BankTokens WHERE userid = $1", [userId])
    if (res.rows.length === 0) {
      return null
    }
    return res.rows[0].token
  } catch (err) {
    throw err
  }
}

module.exports = {
  createUser,
  getUserByName,
  getUserById,
  getUserInfo,
  
  getAllOperations,
  createOperation,
  
  // Експортуємо нові функції під старими назвами, щоб не зламати categoryController.js
  getAllCategories: getAllLimits,
  createCategory: createLimit,
  setCategoryTarget: setLimitTarget,
  deleteCategory: deleteLimit,
  
  generateToken,
  cancelToken,
  isTokenInvalid,
  
  getAllSavings,
  createSavings,
  updateSavings,
  deleteSavings,
  
  getReport_incvsexp,
  getReport_CatExp,
  getReport_ExpenseTrend,
  
  getBankToken,
  setBankToken
}