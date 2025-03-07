const mongoose = require("mongoose");
 // Import db2 connection

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
    tuitionLocation: [{ type: String, required: true }], // Array to store multiple locations
    preferredTime: [{ type: String, required: true }], // Array to store multiple times
    preferredTutor: { type: String, enum: ["Male", "Female", "Any"], required: true },
    feeType: { type: String, enum: ["Hourly", "Monthly", "OneTime"], required: true },
    about: { type: String, required: true },
    feeAmount: { type: Number, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: Number, required: true },
    locality: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    sorted: { type: String, enum: ["Yes", "No"], default: "No", required: true },
    attachedFiles: [
      {
        fileType: { type: String, enum: ["Aadhar", "Pancard", "Other"], required: true },
        filePath: { type: String, required: true },
      }
    ],
    board: { type: String},
    qualification: { type: String  },
    experience: { type: Number  },
    age: { type: Number},
    
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  },
  { timestamps: true }
);

const Registration = mongoose.model("Registration", registrationSchema);
module.exports = Registration;
