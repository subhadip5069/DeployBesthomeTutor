const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ Database URL is missing in .env file!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false, // Prevent queries before connection
    });
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// ❌ Don't execute here → Export the function
module.exports = connectDB;
