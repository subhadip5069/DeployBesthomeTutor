const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const db1URI = process.env.DB1_URL || "mongodb+srv://subhadip11103:7JN5CzLsoJbmivt5@cluster0.znk8r.mongodb.net/myFirstTUTORDatabase?retryWrites=true&w=majority";
const db2URI = process.env.DB2_URL || "mongodb+srv://survasurva246:ADdUGbd8vQeDqmIZ@cluster0.9yeywwz.mongodb.net/mySecondTUTORDatabase?retryWrites=true&w=majority";

// Ensure database URIs are defined
if (!db1URI || !db2URI) {
  console.error("❌ Database URL(s) missing in .env file!");
  process.exit(1);
}

// MongoDB connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 60000, // Increase timeout to 60s
  bufferCommands: false, // Prevent Mongoose from buffering commands
};

// Connect to databases
const db1 = mongoose.createConnection(db1URI, connectionOptions);
const db2 = mongoose.createConnection(db2URI, connectionOptions);

// Log successful connections
db1.on("connected", () => console.log(`✅ Connected to db1: ${db1.name}`));
db2.on("connected", () => console.log(`✅ Connected to db2: ${db2.name}`));

// Log errors
db1.on("error", (err) => console.error("❌ Error connecting to db1:", err));
db2.on("error", (err) => console.error("❌ Error connecting to db2:", err));

module.exports = { db1, db2 };
