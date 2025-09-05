const express = require('express')
const router = express.Router()
const {
  updatePerformanceScore,
} = require('../controllers/PerformanceScore.controller')


router.put('/', updatePerformanceScore)

module.exports = router
