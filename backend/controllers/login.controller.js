const Employee = require('../models/Employee.model')

const login = async (req, res) => {
  try {
    const { email, phone } = req.body

    // Validate input
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone number are required',
      })
    }

    // Find employee by email and phone
    const employee = await Employee.findOne({
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
    }).select('-__v') // Exclude version field

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    // Determine dashboard route based on employment type
    let redirectTo
    switch (employee.employmentType) {
      case 'Admin':
        redirectTo = '/adminDashboard'
        break
      case 'Manager':
        redirectTo = '/managerDashboard'
        break
      case 'general_employee':
        redirectTo = '/employeeDashboard'
        break
      default:
        redirectTo = '/employeeDashboard'
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      redirectTo: redirectTo,
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        employmentType: employee.employmentType,
        officeLocation: employee.officeLocation || 'New York Office', // Default if not set
        position: employee.position || 'Employee',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

module.exports = {
  login,
}
