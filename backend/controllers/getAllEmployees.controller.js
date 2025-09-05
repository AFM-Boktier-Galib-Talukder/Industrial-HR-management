const Employee = require('../models/Employee.model')

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select('-__v')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Employees fetched successfully',
      count: employees.length,
      employees: employees,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    })
  }
}

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params

    const employee = await Employee.findById(id).select('-__v')

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.status(200).json({
      message: 'Employee fetched successfully',
      employee: employee,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching employee',
      error: error.message,
    })
  }
}

const getEmployeeReportById = async (req, res) => {
  try {
    const { id } = req.params

    const employee = await Employee.findById(id).select('report')

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.status(200).json({
      message: 'Employee report fetched successfully',
      report: employee.report,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching employee report',
      error: error.message,
    })
  }
}

module.exports = { getAllEmployees, getEmployeeById, getEmployeeReportById }
