const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const razorpay = require("razorpay");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const connectDB = require("./App/config/db");
const MongoStore = require("connect-mongo");
 // ✅ Import database connections

require("dotenv").config();

const app = express();

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});; // Place before flash
app.use(flash());



 // Store instance in app for reuse
 connectDB();




// Middleware to make flash messages available in templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.info = req.flash("info");
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up EJS
app.set("view engine", "ejs");
app.set("views", "views");

// Public folder
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'App/multer/uploads')));

// Routes
app.use("/", require("./App/routes/user/index"));
// admin routes
app.use("/", require("./App/routes/Admin/index"));
// Start server after database connections are established
const PORT =  process.env.PORT || 5100;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT} `);
  console.log(`Database Connections:`);
 console.log(`MongoDB: ${process.env.MONGO_URI}`);
});
