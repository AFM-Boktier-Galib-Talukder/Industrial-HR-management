const express = require('express')
const router = express.Router()
const { updateShift } = require('../controllers/Shift.controller')

router.put('/', updateShift)

module.exports = router
