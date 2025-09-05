const Employee = require('../models/Employee.model')

// Controller for employee check-in
const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Store check-in time
    employee.lastCheckIn = new Date()
    await employee.save()

    res.status(200).json({
      message: 'Checked in successfully',
      checkInTime: employee.lastCheckIn,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error during check-in',
      error: error.message,
    })
  }
}

// Controller for employee check-out
const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    if (!employee.lastCheckIn) {
      return res.status(400).json({ message: 'No check-in record found' })
    }

    const checkOutTime = new Date()
    const timeDifferenceInMinutes =
      (checkOutTime - employee.lastCheckIn) / (1000 * 60)

    // Prevent checkout within the first minute
    if (timeDifferenceInMinutes < 1) {
      return res.status(400).json({
        message: 'You cannot check out within one minute of checking in.',
      })
    }

    const hoursWorked = timeDifferenceInMinutes / 60 // Convert minutes to hours

    // Update worked hours
    employee.workedHours += hoursWorked
    employee.lastCheckIn = null // Reset check-in time
    await employee.save()

    res.status(200).json({
      message: 'Checked out successfully',
      hoursWorked: hoursWorked.toFixed(2),
      totalWorkedHours: employee.workedHours,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error during check-out',
      error: error.message,
    })
  }
}

module.exports = { checkIn, checkOut }
