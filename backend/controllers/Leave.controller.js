const Leave = require('../models/Leave.model')
const Employee = require('../models/Employee.model')

const submitLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, duration } =
      req.body

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

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

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'pending', 'approved', or 'rejected'",
      })
    }

    const leaveRequest = await Leave.findById(id)
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    const previousStatus = leaveRequest.status

    leaveRequest.status = status
    await leaveRequest.save()

    if (status === 'approved' && previousStatus !== 'approved') {
      await Employee.findByIdAndUpdate(leaveRequest.employeeId, {
        $inc: { totalLeaveTaken: leaveRequest.duration },
      })
    } else if (previousStatus === 'approved' && status !== 'approved') {
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
