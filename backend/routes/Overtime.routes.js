const express = require('express')
const router = express.Router()
const {
  submitOvertimeRequest,
  getOvertimeRequests,
  updateOvertimeStatus,
} = require('../controllers/Overtime.controller')

// Route to submit an overtime request
router.post('/', submitOvertimeRequest)

// Route to get all overtime requests
router.get('/', getOvertimeRequests)

// Route to update overtime request status
router.put('/:id', updateOvertimeStatus)

module.exports = router
