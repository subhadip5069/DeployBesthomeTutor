const mongoose = require("mongoose");
 // Import db1 connection

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "tutor", "admin"],
      default: "student",
      required: true,
    },
    randomId: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isVerified: { type: Boolean, default: false },
    balance: { type: Number, default: 0 }, 
    currentbalance :{ type: Number, default: 0 },
    unlockedContacts: { type: Number, default: 0 }, // Total from plan
    unlockedContactsRemaining: { type: Number, default: 0 }, // Remaining unlocks
    unlockedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    unlockedTutors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    profileImage:{
      type: String,
  },
  },
  { timestamps: true }
);
userSchema.pre("save", function (next) {
  if (this.unlockedContactsRemaining > 0) {
    this.currentbalance = (this.balance / this.unlockedContacts) * this.unlockedContactsRemaining;
  } else {
    this.currentbalance = 0; // Prevent division by zero
  }
  next();
});


const User = mongoose.model("User", userSchema);
module.exports = User;
