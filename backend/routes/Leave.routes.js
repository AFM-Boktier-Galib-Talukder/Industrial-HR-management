const express = require('express')
const router = express.Router()
const {
  submitLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
} = require('../controllers/Leave.controller')

router.post('/', submitLeaveRequest)

router.get('/', getLeaveRequests)

router.put('/:id', updateLeaveStatus)

module.exports = router
