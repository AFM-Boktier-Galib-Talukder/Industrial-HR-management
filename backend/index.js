const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const { connectMongoDB } = require('./connections')

const addEmployeeRoutes = require('./routes/addEmployee.routes')
const getAllEmployeesRoutes = require('./routes/getAllEmployees.routes')
const checkInOutRoutes = require('./routes/CheckInOut.routes')
const payrollRoutes = require('./routes/Payroll.routes')
const performanceScoreRoutes = require('./routes/PerformanceScore.routes')
const shiftRoutes = require('./routes/Shift.routes')
const leaveRoutes = require('./routes/Leave.routes')
const overtimeRoutes = require('./routes/Overtime.routes')
const taskRoutes = require('./routes/Task.routes')
const loginRoutes = require('./routes/login.routes')
const reportRoutes = require('./routes/report.routes') // Import report routes

const app = express()
const PORT = 1490

connectMongoDB()
  .then(() => console.log('MongoDB Connected✅'))
  .catch(err => {
    console.log('Mongo Error', err)
  })

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.use('/api/auth', loginRoutes)
app.use('/api/employees', addEmployeeRoutes)
app.use('/api/employees', getAllEmployeesRoutes)
app.use('/api/checkinout', checkInOutRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/performance', performanceScoreRoutes)
app.use('/api/shift', shiftRoutes)
app.use('/api/leave', leaveRoutes)
app.use('/api/overtime', overtimeRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
