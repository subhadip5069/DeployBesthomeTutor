const mongoose = require("mongoose");


const purchasePlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true }, // Plan Name (e.g., "Basic", "Premium")
    price: { type: Number, required: true }, // Price of the plan
    validity: { type: Number, required: true }, // Validity in days
    unlockUserCount: { type: Number, required: true }, // Number of users tutor can unlock
    description: { type: String }, // Description of the plan
    features: [
      {
        name: { type: String, required: true }, // Feature name
        isEnabled: { type: Boolean, default: false }, // True or False
      }
    ],
    sgst: { type: Number, required: true }, // SGST
    cgst: { type: Number, required: true }, // CGST
    igst: { type: Number, required: true }, // IGST
    finalPrice: { type: Number, required: true }, // Final Price
    status: { type: String, enum: ["active", "inactive"], default: "active" }, 
    role: { type: String, enum: ["student", "tutor"], required: true }, // Plan status
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

const PurchasePlan = mongoose.model("PurchasePlan", purchasePlanSchema);
module.exports = PurchasePlan;
