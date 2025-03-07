const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ Database URL is missing in .env file!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    console.log("⏳ Waiting 5 seconds before attempting MongoDB connection...");
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // 15s buffer time
    
    await mongoose.connect(dbURI, {
      bufferCommands: false, // Prevent queries before connection
    });

    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Export the function without executing it immediately
module.exports = connectDB;
