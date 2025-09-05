const express = require('express')
const router = express.Router()
const {
  submitLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
} = require('../controllers/Leave.controller')

// Route to submit a leave request
router.post('/', submitLeaveRequest)

// Route to get all leave requests
router.get('/', getLeaveRequests)

// Route to update leave request status
router.put('/:id', updateLeaveStatus)

module.exports = router
