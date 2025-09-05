const express = require('express')
const router = express.Router()
const {
  assignTask,
  getTasks,
  updateTaskStatus,
} = require('../controllers/Task.controller')

router.post('/', assignTask)

router.get('/:employeeId', getTasks)

router.put('/:id', updateTaskStatus)

module.exports = router
