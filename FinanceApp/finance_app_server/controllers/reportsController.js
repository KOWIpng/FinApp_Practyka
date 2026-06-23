const db = require("../db")

async function getReport(req, res) {
  try {
    const userId = req.params.userId
    const year = req.query.year
    const month = req.query.month

    console.log(`Запит звіту для користувача ${userId}, рік: ${year}, місяць: ${month}`)

    const report = await db.getReport_incvsexp(userId, year, month)
    res.json(report)
  } catch (err) {
    console.error("Помилка getReport:", err.toString())
    res.status(500).json({ message: "Помилка отримання даних звіту" })
  }
}

async function getReportCatExp(req, res) {
  try {
    const userId = req.params.userId
    const year = req.query.year
    const month = req.query.month

    console.log(`Запит звіту по категоріям для користувача ${userId}, рік: ${year}, місяць: ${month}`)

    const report = await db.getReport_CatExp(userId, year, month)
    res.json(report)
  } catch (err) {
    console.error("Помилка getReportCatExp:", err.toString())
    res.status(500).json({ message: "Помилка отримання даних звіту по категоріям" })
  }
}

async function getExpenseTrend(req, res) {
  try {
    const userId = req.params.userId
    const year = req.query.year
    const month = req.query.month

    console.log(`Запит тренду витрат для користувача ${userId}, рік: ${year}, місяць: ${month}`)

    const report = await db.getReport_ExpenseTrend(userId, year, month)
    res.json(report)
  } catch (err) {
    console.error("Помилка getExpenseTrend:", err.toString())
    res.status(500).json({ message: "Помилка отримання даних тренду витрат" })
  }
}

module.exports = { getReport, getReportCatExp, getExpenseTrend }
