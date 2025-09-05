const Employee = require('../models/Employee.model')

const updatePerformanceScore = async (req, res) => {
  try {
    const { employeeId, performanceScore } = req.body

    if (
      performanceScore < 0 ||
      performanceScore > 100 ||
      !Number.isInteger(performanceScore)
    ) {
      return res.status(400).json({
        message: 'Performance score must be an integer between 0 and 100',
      })
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { performanceScore },
      { new: true, runValidators: true }
    )

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.status(200).json({
      message: 'Performance score updated successfully',
      employee: `${employee.firstName} ${employee.lastName}`,
      performanceScore: employee.performanceScore,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating performance score',
      error: error.message,
    })
  }
}

module.exports = { updatePerformanceScore }
