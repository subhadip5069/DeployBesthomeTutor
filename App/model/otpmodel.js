const mongoose = require("mongoose");
const { db1 } = require("../config/db");
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // OTP expires in 10 minutes
});

module.exports = db1.model("Otp", otpSchema);
