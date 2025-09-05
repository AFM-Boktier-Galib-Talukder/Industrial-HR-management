const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema(
  {
    // Personal Details
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },

    // Employment Details
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    employmentType: {
      type: String,
      enum: ['general_employee', 'Manager', 'Admin'],
      default: 'general_employee',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },

    // New fields
    workedHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 168,
    },

    // Report as a long string (5+ sentences)
    report: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: 'Good', // Increased length for 5+ sentences
    },

    // Shift with simplified enum
    shift: {
      type: String,
      enum: ['day', 'night'],
      default: 'day',
    },

    performanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      validate: {
        validator: Number.isInteger,
        message: 'Performance score must be an integer',
      },
    },

    // Newly added fields
    totalLeaveTaken: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Total leave taken must be an integer',
      },
    },

    overtimeApproved: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Overtime approved must be an integer',
      },
    },

    // Field for tracking the last check-in time
    lastCheckIn: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
)

// Create model from schema
const Employee = mongoose.model('Employee', employeeSchema)

module.exports = Employee
