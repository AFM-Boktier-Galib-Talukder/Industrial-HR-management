const Employee = require('../models/Employee.model')

const addEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      jobTitle,
      department,
      salary,
      employmentType,
      shift,
    } = req.body

    const existingEmployee = await Employee.findOne({ email })
    if (existingEmployee) {
      return res
        .status(400)
        .json({ message: 'Employee with this email already exists' })
    }

    const newEmployee = new Employee({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      jobTitle,
      department,
      salary,
      employmentType,
      shift,
    })

    await newEmployee.save()
    res.status(201).json({
      message: 'Employee added successfully',
      employee: newEmployee,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error adding employee',
      error: error.message,
    })
  }
}

module.exports = { addEmployee }
