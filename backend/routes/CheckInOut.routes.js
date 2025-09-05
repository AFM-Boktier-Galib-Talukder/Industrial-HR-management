const express = require('express')
const router = express.Router()
const { checkIn, checkOut } = require('../controllers/CheckInOut.controller')

// Route for employee check-in
router.post('/checkin', checkIn)

// Route for employee check-out
router.post('/checkout', checkOut)

module.exports = router
