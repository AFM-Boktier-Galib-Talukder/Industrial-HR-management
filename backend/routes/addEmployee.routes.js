const express = require('express')
const router = express.Router()
const { addEmployee } = require('../controllers/addEmployee.controller')

router.post('/', addEmployee)

module.exports = router
