const mongoose = require("mongoose");


const razorpayPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who made the payment
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchasePlan", required: true }, // Purchased plan
    amount: { type: Number, required: true }, // Amount paid in paise (Razorpay uses paise)
    currency: { type: String, default: "INR" }, // Currency (INR by default)
    razorpayOrderId: { type: String, required: true, unique: true }, // Razorpay Order ID
    razorpayPaymentId: { type: String, unique: true }, // Razorpay Payment ID (provided after successful payment)
    razorpaySignature: { type: String }, // Razorpay signature for payment verification
    paymentStatus: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
    }, // Payment status
    errorMessage: { type: String }, // Error message in case of payment failure
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

const RazorpayPayment = mongoose.model("RazorpayPayment", razorpayPaymentSchema);
module.exports = RazorpayPayment;
