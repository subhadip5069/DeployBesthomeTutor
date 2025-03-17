const mongoose = require("mongoose");
 // Import db2 connection

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User",}, // Reference to the user
    tuitionLocation: [{ type: String}], // Array to store multiple locations
    preferredTime: [{ type: String}], // Array to store multiple times
    preferredTutor: { type: String, enum: ["Male", "Female", "Any"],},
    feeType: { type: String, enum: ["Hourly", "Monthly", "OneTime"],},
    about: { type: String},
    feeAmount: { type: Number},
    state: { type: String},
    city: { type: String},
    pincode: { type: Number},
    locality: { type: String},
    subject: { type: [String], required: true },
    class: { type: [String], required: true },
    sorted: { type: String, enum: ["Yes", "No"], default: "No",},
    attachedFiles: [
      {
        fileType: { type: String, enum: ["Aadhar", "Pancard", "Other"],},
        filePath: { type: String},
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
