const express = require('express')
const router = express.Router()
const { updateShift } = require('../controllers/Shift.controller')

// Route to update employee shift
router.put('/', updateShift)

module.exports = router
