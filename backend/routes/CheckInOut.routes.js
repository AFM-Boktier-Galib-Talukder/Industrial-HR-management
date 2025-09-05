const express = require('express')
const router = express.Router()
const { checkIn, checkOut } = require('../controllers/CheckInOut.controller')

router.post('/checkin', checkIn)

router.post('/checkout', checkOut)

module.exports = router
