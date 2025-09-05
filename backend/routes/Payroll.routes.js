const express = require('express')
const router = express.Router()
const { calculatePayroll } = require('../controllers/Payroll.controller')

router.post('/', calculatePayroll)

module.exports = router
