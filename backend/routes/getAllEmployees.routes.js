const express = require('express')
const router = express.Router()
const {
  getAllEmployees,
  getEmployeeById,
  getEmployeeReportById,
} = require('../controllers/getAllEmployees.controller')

router.get('/', getAllEmployees)

router.get('/:id', getEmployeeById)

router.get('/:id/report', getEmployeeReportById)

module.exports = router
