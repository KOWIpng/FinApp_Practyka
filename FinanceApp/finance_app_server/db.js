const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const db = new sqlite3.Database("./financeDB.db")
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
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO Users (name, password) VALUES (?, ?)", name, hashedPassword, function (err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
  })
}

async function getUserByName(name) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM Users WHERE name = ?", name, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

async function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM Users WHERE code = ?", id, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

async function getAllOperations(userId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM vOperations WHERE User_ID = ?", userId, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function createOperation(userId, date, categoryId, amount, currency, description) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO Operations (user_id, date, category_id, amount, currency, description) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      date,
      categoryId,
      amount,
      currency,
      description,
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      },
    )
  })
}

async function getAllCategories(userId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM vCategories WHERE user_id = ?", userId, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function createCategory(name, userId, direction) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO Categories (name, user_id, direction) VALUES (?, ?, ?)",
      [name, userId, direction], // ← правильний формат
      function (err) {
        if (err){
            console.error('❗ SQLite помилка:', err);
            reject(err);
        }else {
            resolve(this.lastID);
        }
      }
    );
  });
}

function setCategoryTarget(categoryId, userId, target) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Categories SET target = ? WHERE code = ? AND user_id = ?`,
      [target, categoryId, userId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

function deleteCategory(categoryId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Categories WHERE code = ? AND user_id = ?`,
      [categoryId, userId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}




async function getAllOperationTypes() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM OperationTypes", (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function createOperationType(direction, name) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO OperationTypes (direction, name) VALUES (?, ?)", direction, name, function (err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
  })
}

async function getAllSavings(userId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM Savings WHERE user_id = ?", userId, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function createSavings(userId, title, target, current) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO Savings (user_id, title, target, current) VALUES (?, ?, ?, ?)",
      userId,
      title,
      target,
      current,
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      },
    )
  })
}

async function updateSavings(code, amount) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE Savings SET current = current + ? WHERE code = ?", amount, code, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function deleteSavings(code) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM Savings WHERE code = ?", code, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM vUserFullInfo WHERE user_id = ?", userId, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function getReport_incvsexp(userId, year, month) {
  let query = `
        SELECT 
            strftime('%Y-%m', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) AS month,
            c.direction,
            SUM(o.amount) as total_amount
        FROM Operations o
        JOIN Categories c ON o.category_id = c.code
        WHERE o.user_id = ?
    `

  const params = [userId]

  if (year) {
    query += ` AND strftime('%Y', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(year.toString())
  }

  if (month) {
    query += ` AND strftime('%m', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(month.toString().padStart(2, "0"))
  }

  query += ` GROUP BY month, c.direction ORDER BY month`

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function getReport_CatExp(userId, year, month) {
  let query = `
        SELECT 
            c.name as category_name, 
            SUM(o.amount) as total_amount 
        FROM Operations o
        JOIN Categories c ON c.code = o.category_id
        WHERE o.user_id = ? AND c.direction = 'expense'
    `

  const params = [userId]

  if (year) {
    query += ` AND strftime('%Y', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(year.toString())
  }

  if (month) {
    query += ` AND strftime('%m', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(month.toString().padStart(2, "0"))
  }

  query += ` GROUP BY c.name`

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function getReport_ExpenseTrend(userId, year, month) {
  // Get the last 6 months of expense data
  let query = `
        SELECT 
            o.date,
            SUM(o.amount) as amount
        FROM Operations o
        JOIN Categories c ON c.code = o.category_id
        WHERE o.user_id = ? AND c.direction = 'expense'
    `

  const params = [userId]

  if (year) {
    query += ` AND strftime('%Y', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(year.toString())
  }

  if (month) {
    query += ` AND strftime('%m', date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2))) = ?`
    params.push(month.toString().padStart(2, "0"))
  }

  query += ` GROUP BY o.date ORDER BY date(substr(o.date, 7, 4) || '-' || substr(o.date, 4, 2) || '-' || substr(o.date, 1, 2)) DESC LIMIT 30`

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function setBankToken(userId, token) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO BankTokens (userid, token) VALUES (?, ?) ON CONFLICT(userid) DO UPDATE SET token = excluded.token;", userId, token, function (err) {
      if (err) reject(err)
      else resolve({"message": "Токен збережено"})
    })
  })
}

async function getBankToken(userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT token FROM BankTokens WHERE userid = ?", userId, function (err, row) {
      if (err) reject(err)
      else if (!row){
        resolve();
      } else {
        resolve(row.token);
      }
    })
  })
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
