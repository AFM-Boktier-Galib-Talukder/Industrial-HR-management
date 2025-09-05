const express = require('express')
const router = express.Router()
const {
  assignTask,
  getTasks,
  updateTaskStatus,
} = require('../controllers/Task.controller')

// Route to assign a task
router.post('/', assignTask)

// Route to get tasks for an employee
router.get('/:employeeId', getTasks)

// Route to update task status
router.put('/:id', updateTaskStatus)

module.exports = router
