const Employee = require('../models/Employee.model')

// Function to generate report based on employee metrics
const generateEmployeeReport = employee => {
  const { workedHours, performanceScore, totalLeaveTaken, overtimeApproved } =
    employee

  // Define rating thresholds
  let rating = ''
  let reportTemplate = ''

  // Determine rating based on metrics
  if (
    performanceScore >= 90 &&
    workedHours >= 160 &&
    totalLeaveTaken <= 10 &&
    overtimeApproved >= 20
  ) {
    rating = 'excellent'
    reportTemplate = `The employee has far exceeded expectations, logging [${workedHours}] highly productive hours that have significantly advanced key projects. They earned an exceptional performance score of [${performanceScore}]%, consistently delivering work of the highest quality and often going above and beyond their core duties. Their leave taken [${totalLeaveTaken}] days was well-planned and never disrupted operations. Furthermore, they contributed a substantial [${overtimeApproved}] hours of approved overtime, showcasing extraordinary dedication and commitment to the team's success.
Overall Rating: Exceeds Expectations`
  } else if (
    performanceScore >= 75 &&
    workedHours >= 140 &&
    totalLeaveTaken <= 15
  ) {
    rating = 'good'
    reportTemplate = `This employee has consistently met their required hours, completing [${workedHours}] hours of work this period. They achieved a solid performance score of [${performanceScore}]%, reliably meeting all their key responsibilities and objectives. Their leave usage [${totalLeaveTaken}] days was managed responsibly with adequate notice. A moderate amount of approved overtime [${overtimeApproved}] hours demonstrates a willingness to support the team during busy periods.
Overall Rating: Meets Expectations`
  } else if (performanceScore >= 60 && workedHours >= 120) {
    rating = 'bad'
    reportTemplate = `The employee's total worked hours of [${workedHours}] are below the expected threshold, impacting team output. Their performance score of [${performanceScore}]% is subpar and falls short of established goals, highlighting several key areas requiring immediate improvement. While their total leave taken [${totalLeaveTaken}] days was within policy, its timing has occasionally disrupted workflow. The limited approved overtime of [${overtimeApproved}] hours shows a lack of voluntary contribution to pressing deadlines.
Overall Rating: Needs Improvement`
  } else {
    rating = 'very_bad'
    reportTemplate = `This employee has worked only [${workedHours}] hours against their target, demonstrating a significant shortfall in their core contribution. Their performance score of [${performanceScore}]% is critically low and fails to meet even the most fundamental job requirements. Furthermore, they have exceeded their allotted leave by [${totalLeaveTaken}] days, indicating poor time management and a lack of commitment. The minimal overtime worked ([${overtimeApproved}] hours) does not compensate for these substantial deficiencies.
Overall Rating: Unsatisfactory`
  }

  return {
    rating,
    report: reportTemplate,
  }
}

// Update report for a single employee
const updateEmployeeReport = async (req, res) => {
  try {
    const { id } = req.params

    const employee = await Employee.findById(id)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const { report } = generateEmployeeReport(employee)

    employee.report = report
    await employee.save()

    res.status(200).json({
      message: 'Employee report updated successfully',
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        report: employee.report,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating employee report',
      error: error.message,
    })
  }
}

// Update reports for all employees
const updateAllEmployeesReports = async (req, res) => {
  try {
    const employees = await Employee.find({})

    const updatePromises = employees.map(async employee => {
      const { report } = generateEmployeeReport(employee)
      employee.report = report
      return employee.save()
    })

    await Promise.all(updatePromises)

    res.status(200).json({
      message: 'All employee reports updated successfully',
      count: employees.length,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating all employee reports',
      error: error.message,
    })
  }
}

// Get report analysis for an employee
const getEmployeeReportAnalysis = async (req, res) => {
  try {
    const { id } = req.params

    const employee = await Employee.findById(id)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const { rating, report } = generateEmployeeReport(employee)

    res.status(200).json({
      message: 'Employee report analysis generated successfully',
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        workedHours: employee.workedHours,
        performanceScore: employee.performanceScore,
        totalLeaveTaken: employee.totalLeaveTaken,
        overtimeApproved: employee.overtimeApproved,
        currentReport: employee.report,
        generatedRating: rating,
        generatedReport: report,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error generating employee report analysis',
      error: error.message,
    })
  }
}

module.exports = {
  updateEmployeeReport,
  updateAllEmployeesReports,
  getEmployeeReportAnalysis,
}
