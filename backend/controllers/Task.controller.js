const Task = require('../models/Task.model')
const Employee = require('../models/Employee.model')

const assignTask = async (req, res) => {
  try {
    const { employeeId, tasks } = req.body

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const taskPromises = tasks.map(task => {
      const newTask = new Task({
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
      })
      return newTask.save()
    })

    const savedTasks = await Promise.all(taskPromises)

    res.status(201).json({
      message: 'Tasks assigned successfully',
      tasks: savedTasks,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error assigning tasks',
      error: error.message,
    })
  }
}

const getTasks = async (req, res) => {
  try {
    const { employeeId } = req.params
    const { status } = req.query

    let query = { employeeId }
    if (status) query.status = status

    const tasks = await Task.find(query).sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Tasks fetched successfully',
      count: tasks.length,
      tasks: tasks,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching tasks',
      error: error.message,
    })
  }
}

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'in-progress', or 'completed'",
      })
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.status(200).json({
      message: 'Task status updated successfully',
      task: task,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating task status',
      error: error.message,
    })
  }
}

module.exports = { assignTask, getTasks, updateTaskStatus }
