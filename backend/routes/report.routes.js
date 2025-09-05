const express = require('express')
const router = express.Router()
const {
  updateEmployeeReport,
  updateAllEmployeesReports,
  getEmployeeReportAnalysis,
} = require('../controllers/report.controller')

// @route   PATCH /api/reports/employee/:id
// @desc    Update report for a specific employee
// @access  Public
router.patch('/employee/:id', updateEmployeeReport)

// @route   PATCH /api/reports/all
// @desc    Update reports for all employees
// @access  Public
router.patch('/all', updateAllEmployeesReports)

// @route   GET /api/reports/analysis/:id
// @desc    Get report analysis for a specific employee (without saving)
// @access  Public
router.get('/analysis/:id', getEmployeeReportAnalysis)

module.exports = router
