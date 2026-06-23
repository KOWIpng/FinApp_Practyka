const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// підключення до бази постгрес
const pool = new Pool({
  user: "eugene",       // Твій користувач у Postgres
  host: "localhost",
  database: "postgres",   // Твоя база даних
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

async function getAllOperations(userId) {
  try {
    const res = await pool.query("SELECT * FROM vOperations WHERE User_ID = $1", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

async function createOperation(userId, date, categoryId, amount, currency, description) {
  try {
    const res = await pool.query(
      "INSERT INTO Operations (user_id, date, category_id, amount, currency, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING code",
      [userId, date, categoryId, amount, currency, description]
    )
    return res.rows[0].code
  } catch (err) {
    throw err
  }
}

async function getAllCategories(userId) {
  try {
    const res = await pool.query("SELECT * FROM vCategories WHERE user_id = $1", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

async function createCategory(name, userId, direction) {
  try {
    const res = await pool.query(
      "INSERT INTO Categories (name, user_id, direction) VALUES ($1, $2, $3) RETURNING code",
      [name, userId, direction]
    )
    return res.rows[0].code
  } catch (err) {
    console.error('❗ Postgres помилка:', err);
    throw err
  }
}

async function setCategoryTarget(categoryId, userId, target) {
  try {
    await pool.query(
      "DELETE FROM Categories WHERE code = $1 AND user_id = $2",
      [categoryId, userId]
    )
    return true
  } catch (err) {
    throw err
  }
}

async function getAllOperationTypes() {
  try {
    const res = await pool.query("SELECT * FROM OperationTypes")
    return res.rows
  } catch (err) {
    throw err
  }
}




async function getAllOperationTypes() {
 try {
    const res = await pool.query("SELECT * FROM OperationTypes")
    return res.rows
  } catch (err) {
    throw err
  }
}

async function createOperationType(direction, name) {
  try {
    const res = await pool.query(
      "INSERT INTO OperationTypes (direction, name) VALUES ($1, $2) RETURNING code",
      [direction, name]
    )
    return res.rows[0].code
  } catch (err) {
    throw err
  }
}

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

async function getUserInfo(userId) {
 try {
    const res = await pool.query("SELECT * FROM vUserFullInfo WHERE user_id = $1", [userId])
    return res.rows
  } catch (err) {
    throw err
  }
}

async function getReport_incvsexp(userId, year, month) {
 let query = `
        SELECT 
            TO_CHAR(o.date, 'YYYY-MM') AS month,
            c.direction,
            SUM(o.amount) as total_amount
        FROM Operations o
        JOIN Categories c ON o.category_id = c.code
        WHERE o.user_id = $1
    `

  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM o.date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }

  if (month) {
    query += ` AND EXTRACT(MONTH FROM o.date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }

  query += ` GROUP BY month, c.direction ORDER BY month`

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
            c.name as category_name, 
            SUM(o.amount) as total_amount 
        FROM Operations o
        JOIN Categories c ON c.code = o.category_id
        WHERE o.user_id = $1 AND c.direction = 'expense'
    `
  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM o.date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }

  if (month) {
    query += ` AND EXTRACT(MONTH FROM o.date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }

  query += ` GROUP BY c.name`

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
            o.date,
            SUM(o.amount) as amount
        FROM Operations o
        JOIN Categories c ON c.code = o.category_id
        WHERE o.user_id = $1 AND c.direction = 'expense'
    `
  const params = [userId]
  let paramIndex = 2

  if (year) {
    query += ` AND EXTRACT(YEAR FROM o.date) = $${paramIndex}`
    params.push(year)
    paramIndex++
  }

  if (month) {
    query += ` AND EXTRACT(MONTH FROM o.date) = $${paramIndex}`
    params.push(month)
    paramIndex++
  }

  query += ` GROUP BY o.date ORDER BY o.date DESC LIMIT 30`

  try {
    const res = await pool.query(query, params)
    return res.rows
  } catch (err) {
    throw err
  }
}

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

async function deleteCategory(categoryId, userId) {
  try {
    await pool.query(
      "DELETE FROM Categories WHERE code = $1 AND user_id = $2",
      [categoryId, userId]
    )
    return true
  } catch (err) {
    throw err
  }
}

// async function tempChangeBase() {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       DROP TABLE IF EXISTS BankTokens;
//       CREATE TABLE BankTokens (
//         userid INTEGER PRIMARY KEY,
//         token TEXT
//       );
//     `;

//     db.exec(sql, function (err) {
//       if (err) {
//         console.error('Помилка при зміні бази:', err);
//         reject(err);
//       } else {
//         console.log('Таблицю BankTokens оновлено');
//         resolve(true);
//       }
//     });
//   });
// }

module.exports = {
  //tempChangeBase,
  createUser,
  getUserByName,
  getUserById,
  getAllOperations,
  createOperation,
  getAllCategories,
  createCategory,
  getAllOperationTypes,
  createOperationType,
  generateToken,
  cancelToken,
  isTokenInvalid,
  getAllSavings,
  createSavings,
  updateSavings,
  deleteSavings,
  getUserInfo,
  getReport_incvsexp,
  getReport_CatExp,
  getReport_ExpenseTrend,
  deleteCategory,
  setCategoryTarget,
  getBankToken,
  setBankToken
}
