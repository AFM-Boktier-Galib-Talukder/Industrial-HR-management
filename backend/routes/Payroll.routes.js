const express = require('express')
const router = express.Router()
const { calculatePayroll } = require('../controllers/Payroll.controller')

// Route to calculate payroll for an employee
router.post('/', calculatePayroll)

module.exports = router
