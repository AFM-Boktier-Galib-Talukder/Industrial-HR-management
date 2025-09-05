const express = require('express')
const router = express.Router()
const {
  updateEmployeeReport,
  updateAllEmployeesReports,
  getEmployeeReportAnalysis,
} = require('../controllers/report.controller')

router.patch('/employee/:id', updateEmployeeReport)

router.patch('/all', updateAllEmployeesReports)

router.get('/analysis/:id', getEmployeeReportAnalysis)

module.exports = router
