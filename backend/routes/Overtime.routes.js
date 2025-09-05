const express = require('express')
const router = express.Router()
const {
  submitOvertimeRequest,
  getOvertimeRequests,
  updateOvertimeStatus,
} = require('../controllers/Overtime.controller')

router.post('/', submitOvertimeRequest)

router.get('/', getOvertimeRequests)

router.put('/:id', updateOvertimeStatus)

module.exports = router
