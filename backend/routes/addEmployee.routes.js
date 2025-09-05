const express = require('express')
const router = express.Router()
const { addEmployee } = require('../controllers/addEmployee.controller')

// Route to add a new employee
router.post('/', addEmployee)

module.exports = router
