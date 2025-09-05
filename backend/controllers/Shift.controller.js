const Employee = require('../models/Employee.model')

const updateShift = async (req, res) => {
  try {
    const { employeeId, shift } = req.body

    // Validate shift
    if (!['day', 'night'].includes(shift)) {
      return res.status(400).json({
        message: "Shift must be either 'day' or 'night'",
      })
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { shift },
      { new: true, runValidators: true }
    )

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.status(200).json({
      message: 'Shift updated successfully',
      employee: `${employee.firstName} ${employee.lastName}`,
      shift: employee.shift,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating shift',
      error: error.message,
    })
  }
}

module.exports = { updateShift }
