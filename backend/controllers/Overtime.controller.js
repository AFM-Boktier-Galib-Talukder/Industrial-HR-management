// const Overtime = require('../models/Overtime.model')
// const Employee = require('../models/Employee.model')

// const submitOvertimeRequest = async (req, res) => {
//   try {
//     const { employeeId, date, hours, startTime, endTime, reason } = req.body

//     // Check if employee exists
//     const employee = await Employee.findById(employeeId)
//     if (!employee) {
//       return res.status(404).json({ message: 'Employee not found' })
//     }

//     // Create new overtime request
//     const overtimeRequest = new Overtime({
//       employeeId,
//       employeeName: `${employee.firstName} ${employee.lastName}`,
//       date,
//       hours: parseFloat(hours),
//       startTime,
//       endTime,
//       reason,
//     })

//     await overtimeRequest.save()

//     res.status(201).json({
//       message: 'Overtime request submitted successfully',
//       overtimeRequest: overtimeRequest,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error submitting overtime request',
//       error: error.message,
//     })
//   }
// }

// const getOvertimeRequests = async (req, res) => {
//   try {
//     const { status, employeeId } = req.query

//     let query = {}
//     if (status) query.status = status
//     if (employeeId) query.employeeId = employeeId

//     const overtimeRequests = await Overtime.find(query)
//       .populate('employeeId', 'firstName lastName')
//       .sort({ createdAt: -1 })

//     res.status(200).json({
//       message: 'Overtime requests fetched successfully',
//       count: overtimeRequests.length,
//       overtimeRequests: overtimeRequests,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching overtime requests',
//       error: error.message,
//     })
//   }
// }

// const updateOvertimeStatus = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { status } = req.body

//     // Validate status
//     if (!['pending', 'approved', 'rejected'].includes(status)) {
//       return res.status(400).json({
//         message: "Status must be 'pending', 'approved', or 'rejected'",
//       })
//     }

//     const overtimeRequest = await Overtime.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true, runValidators: true }
//     )

//     if (!overtimeRequest) {
//       return res.status(404).json({ message: 'Overtime request not found' })
//     }

//     res.status(200).json({
//       message: 'Overtime request status updated successfully',
//       overtimeRequest: overtimeRequest,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error updating overtime request status',
//       error: error.message,
//     })
//   }
// }

// module.exports = {
//   submitOvertimeRequest,
//   getOvertimeRequests,
//   updateOvertimeStatus,
// }

const Overtime = require('../models/Overtime.model')
const Employee = require('../models/Employee.model')

const submitOvertimeRequest = async (req, res) => {
  try {
    const { employeeId, date, hours, startTime, endTime, reason } = req.body

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Create new overtime request
    const overtimeRequest = new Overtime({
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date,
      hours: parseFloat(hours),
      startTime,
      endTime,
      reason,
    })

    await overtimeRequest.save()

    res.status(201).json({
      message: 'Overtime request submitted successfully',
      overtimeRequest: overtimeRequest,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting overtime request',
      error: error.message,
    })
  }
}

const getOvertimeRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query

    let query = {}
    if (status) query.status = status
    if (employeeId) query.employeeId = employeeId

    const overtimeRequests = await Overtime.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Overtime requests fetched successfully',
      count: overtimeRequests.length,
      overtimeRequests: overtimeRequests,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching overtime requests',
      error: error.message,
    })
  }
}

const updateOvertimeStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'approved', or 'rejected'",
      })
    }

    const overtimeRequest = await Overtime.findById(id)
    if (!overtimeRequest) {
      return res.status(404).json({ message: 'Overtime request not found' })
    }

    // Store the previous status for comparison
    const previousStatus = overtimeRequest.status

    // Update the overtime request status
    overtimeRequest.status = status
    await overtimeRequest.save()

    // If status changed to approved, update employee's overtimeApproved
    if (status === 'approved' && previousStatus !== 'approved') {
      await Employee.findByIdAndUpdate(overtimeRequest.employeeId, {
        $inc: { overtimeApproved: overtimeRequest.hours },
      })
    }
    // If status changed from approved to something else, subtract the overtime hours
    else if (previousStatus === 'approved' && status !== 'approved') {
      await Employee.findByIdAndUpdate(overtimeRequest.employeeId, {
        $inc: { overtimeApproved: -overtimeRequest.hours },
      })
    }

    res.status(200).json({
      message: 'Overtime request status updated successfully',
      overtimeRequest: overtimeRequest,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating overtime request status',
      error: error.message,
    })
  }
}

module.exports = {
  submitOvertimeRequest,
  getOvertimeRequests,
  updateOvertimeStatus,
}
