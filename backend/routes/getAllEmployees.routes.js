const express = require('express')
const router = express.Router()
const {
  getAllEmployees,
  getEmployeeById,
  getEmployeeReportById,
} = require('../controllers/getAllEmployees.controller')

// Route to get all employees
router.get('/', getAllEmployees)

// Route to get employee by ID
router.get('/:id', getEmployeeById)

// Route to get employee report by ID
router.get('/:id/report', getEmployeeReportById)

module.exports = router
