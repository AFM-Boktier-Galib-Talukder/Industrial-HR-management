const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    deadline: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'meeting'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// Validate that deadline is in the future
taskSchema.pre('save', function (next) {
  if (this.deadline <= new Date()) {
    next(new Error('Deadline must be in the future'))
  } else {
    next()
  }
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task
