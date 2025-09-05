const Employee = require('../models/Employee.model')

const calculatePayroll = async (req, res) => {
  try {
    const { employeeId } = req.body

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Store original values for response
    const oldSalary = employee.salary
    const hoursWorked = employee.workedHours

    // Define the standard number of working hours in a month
    const standardMonthlyHours = 20 * 8 // 160 hours

    // Calculate the new monthly salary based on the proportion of hours worked
    const newMonthlySalary = (hoursWorked / standardMonthlyHours) * oldSalary

    // Update the employee's salary to the newly calculated value
    employee.salary = newMonthlySalary

    // Reset worked hours for the next pay period
    employee.workedHours = 0
    await employee.save()

    res.status(200).json({
      message: 'Employee salary updated successfully',
      employee: `${employee.firstName} ${employee.lastName}`,
      hoursWorked: hoursWorked,
      previousSalary: oldSalary.toFixed(2),
      updatedSalary: employee.salary.toFixed(2),
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating employee salary',
      error: error.message,
    })
  }
}

module.exports = { calculatePayroll }
