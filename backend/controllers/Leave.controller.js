// const Leave = require('../models/Leave.model')
// const Employee = require('../models/Employee.model')

// const submitLeaveRequest = async (req, res) => {
//   try {
//     const { employeeId, leaveType, startDate, endDate, reason, duration } =
//       req.body

//     // Check if employee exists
//     const employee = await Employee.findById(employeeId)
//     if (!employee) {
//       return res.status(404).json({ message: 'Employee not found' })
//     }

//     // Create new leave request
//     const leaveRequest = new Leave({
//       employeeId,
//       employeeName: `${employee.firstName} ${employee.lastName}`,
//       leaveType,
//       startDate,
//       endDate,
//       reason,
//       duration: parseInt(duration),
//     })

//     await leaveRequest.save()

//     res.status(201).json({
//       message: 'Leave request submitted successfully',
//       leaveRequest: leaveRequest,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error submitting leave request',
//       error: error.message,
//     })
//   }
// }

// const getLeaveRequests = async (req, res) => {
//   try {
//     const { status, employeeId } = req.query

//     let query = {}
//     if (status) query.status = status
//     if (employeeId) query.employeeId = employeeId

//     const leaveRequests = await Leave.find(query)
//       .populate('employeeId', 'firstName lastName')
//       .sort({ createdAt: -1 })

//     res.status(200).json({
//       message: 'Leave requests fetched successfully',
//       count: leaveRequests.length,
//       leaveRequests: leaveRequests,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching leave requests',
//       error: error.message,
//     })
//   }
// }

// const updateLeaveStatus = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { status } = req.body

//     // Validate status
//     if (!['pending', 'approved', 'rejected'].includes(status)) {
//       return res.status(400).json({
//         message: "Status must be 'pending', 'approved', or 'rejected'",
//       })
//     }

//     const leaveRequest = await Leave.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true, runValidators: true }
//     )

//     if (!leaveRequest) {
//       return res.status(404).json({ message: 'Leave request not found' })
//     }

//     res.status(200).json({
//       message: 'Leave request status updated successfully',
//       leaveRequest: leaveRequest,
//     })
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error updating leave request status',
//       error: error.message,
//     })
//   }
// }

// module.exports = { submitLeaveRequest, getLeaveRequests, updateLeaveStatus }

const Leave = require('../models/Leave.model')
const Employee = require('../models/Employee.model')

const submitLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, duration } =
      req.body

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Create new leave request
    const leaveRequest = new Leave({
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType,
      startDate,
      endDate,
      reason,
      duration: parseInt(duration),
    })

    await leaveRequest.save()

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: leaveRequest,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting leave request',
      error: error.message,
    })
  }
}

const getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query

    let query = {}
    if (status) query.status = status
    if (employeeId) query.employeeId = employeeId

    const leaveRequests = await Leave.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Leave requests fetched successfully',
      count: leaveRequests.length,
      leaveRequests: leaveRequests,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching leave requests',
      error: error.message,
    })
  }
}

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'approved', or 'rejected'",
      })
    }

    const leaveRequest = await Leave.findById(id)
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    // Store the previous status for comparison
    const previousStatus = leaveRequest.status

    // Update the leave request status
    leaveRequest.status = status
    await leaveRequest.save()

    // If status changed to approved, update employee's totalLeaveTaken
    if (status === 'approved' && previousStatus !== 'approved') {
      await Employee.findByIdAndUpdate(leaveRequest.employeeId, {
        $inc: { totalLeaveTaken: leaveRequest.duration },
      })
    }
    // If status changed from approved to something else, subtract the leave days
    else if (previousStatus === 'approved' && status !== 'approved') {
      await Employee.findByIdAndUpdate(leaveRequest.employeeId, {
        $inc: { totalLeaveTaken: -leaveRequest.duration },
      })
    }

    res.status(200).json({
      message: 'Leave request status updated successfully',
      leaveRequest: leaveRequest,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating leave request status',
      error: error.message,
    })
  }
}

module.exports = { submitLeaveRequest, getLeaveRequests, updateLeaveStatus }
