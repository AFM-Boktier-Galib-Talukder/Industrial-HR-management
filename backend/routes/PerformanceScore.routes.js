const express = require('express')
const router = express.Router()
const {
  updatePerformanceScore,
} = require('../controllers/PerformanceScore.controller')

// Route to update employee performance score
router.put('/', updatePerformanceScore)

module.exports = router
