const mongoose = require('mongoose')

async function connectMongoDB() {
  return mongoose.connect('mongodb://127.0.0.1:27017/Industrial_HRM')
}
module.exports = { connectMongoDB }
