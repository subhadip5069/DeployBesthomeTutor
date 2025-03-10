const { db1 } = require("../../config/db"); // ✅ Get db1
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { signupValidation, loginValidation } = require("../../validation/user");
require("dotenv").config(); // Load env variables
const Otp = require("../../model/otpmodel");
// Import User model from db1
const User = require("../../model/user.model"); // Import User directly
const { title } = require("process");
const Registration = require("../../model/registration");
const { default: mongoose } = require("mongoose");
const otpmodel = require("../../model/otpmodel");


let otpData = { otp: null, expiresAt: null };
function generateOTP() {
  const otp = crypto.randomInt(100000, 999999).toString();
  otpData = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
  return otp;
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
        user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  },
});

class UserAuthController {
  // Generate OTP and save to database
  // async generateAndSaveOTP(email) {
  //   const otp = crypto.randomInt(100000, 999999).toString();
  //   const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry

  //   await User.findOneAndUpdate(
  //     { email },
  //     { otp, otpExpiresAt: expiresAt },
  //     { new: true }
  //   );

  //   return otp;
  // }

  // Signup and Send OTP
 
  
   signup = async (req, res) => {
    try {
      const { name, email, password, phone, role, password2  } = req.body;

      // Validate user input
      const profileimage = req.file ? req.file.filename : "/user/images/profile.png";
  
      // Check if passwords match
      if (password !== password2) {
        req.flash("error", "Passwords do not match.");
        return res.redirect("/register");
      }
  
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        req.flash("error", "Email is already registered. Please log in.");
        return res.redirect("/login");
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Generate an 8-digit unique alphanumeric ID
      const randomId = crypto.randomBytes(4).toString("hex").toUpperCase();
  
      // Generate OTP
      const otp = generateOTP();
  
      // Save new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        randomId,
        isVerified: false,
        profileimage
      });
  
      await newUser.save();
  
      // Store OTP in database
      await Otp.create({ email, otp, createdAt: Date.now() });
  
      // Send OTP Email
      const mailOptions = {
        from: `"A-world" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email -Tutor",
        html: `
          <h2>Verify Your Email</h2>
          <p>Hello,</p>
          <p>Thank you for signing up at <strong>A-world</strong>. Enter the OTP below to verify your email:</p>
          <h3 style="color: red;">${otp}</h3>
          <p>This OTP will expire in 5 minutes.</p>
        `,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          req.flash("error", "Error sending OTP. Please try again.");
          return res.redirect("/register");
        }
        console.log("Email sent:", info.response);
        req.flash("success", "OTP sent successfully. Please check your email.");
        return res.render(`user/verifyemail`,{
          title:"tutor",
          email,
          userId : newUser._id
        });
      });
  
    } catch (error) {
      console.error("Signup Error:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/register");
    }
  };
  verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      // Find OTP in the database
      const otpEntry = await Otp.findOne({ email });
      // user
      const user = await User.findOne({ email });
  
      if (!otpEntry) {
        req.flash("error", "OTP expired or invalid.");
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          userId: user,
          error: "No OTP found for this email. Please request a new one.",
        });
      }
  
      // Check if OTP matches
      if (otpEntry.otp !== otp) {
        req.flash("error", "Incorrect OTP. Please try again.");
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          userId: user,
          error: "No OTP found for this email. Please request a new one.",
        });
      }
  
      // Mark user as verified
      await User.findOneAndUpdate({ email }, { isVerified: true });
  
      // Delete OTP after successful verification
      await Otp.deleteOne({ email });
  
      req.flash("success", "Email verified successfully. You can now log in.");
      return res.redirect("/login");
  
    } catch (error) {
      console.error("OTP Verification Error:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.render("user/verifyemail", {
        title: "Verify Email",
        email,
        userId: user,
        error: "No OTP found for this email. Please request a new one.",
      });
    }
  };
  
  // RESEND OTP CONTROLLER
  resendOtp2 = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/register");
      }
  
      // Generate a new OTP
      const newOtp = generateOTP();
  
      // Update or create a new OTP record
      await Otp.findOneAndUpdate(
        { email },
        { otp: newOtp, createdAt: Date.now() },
        { upsert: true }
      );
  
      // Send OTP Email
      const mailOptions = {
        from: `"A-world" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Resend OTP - Tutor",
        html: `
          <h2>New OTP</h2>
          <p>Hello,</p>
          <p>Your new OTP for email verification is:</p>
          <h3 style="color: red;">${newOtp}</h3>
          <p>This OTP will expire in 5 minutes.</p>
        `,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          req.flash("error", "Error sending OTP. Please try again.");
          return res.render("user/verifyemail", {
            title: "Verify Email",
            email,
            userId: user,
            error: "No OTP found for this email. Please request a new one.",
          });
        }
        console.log("OTP Resent:", info.response);
        req.flash("success", "New OTP sent successfully. Please check your email.");
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          userId: user,
          error: "No OTP found for this email. Please request a new one.",
        });
      });
  
    } catch (error) {
      console.error("Resend OTP Error:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.render("user/verifyemail", {
        title: "Verify Email",
        email,
        userId: null,
        error: "No OTP found for this email. Please request a new one.",
      });
    }
  };
  // Verify OTP and Activate Account
 verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      // Find OTP record in the database
      const otpData = await Otp.findOne({ email });
  
      if (!otpData) {
        console.log("No OTP found for email:", email);
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          error: "No OTP found for this email. Please request a new one.",
        });
      }
  
      // Check if OTP matches
      if (otpData.otp !== otp) {
        console.log("Invalid OTP entered for email:", email);
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          error: "Invalid OTP. Please try again.",
        });
      }
  
      // Check if OTP is expired (5 minutes expiry)
      if (Date.now() > otpData.createdAt.getTime() + 5 * 60 * 1000) {
        console.log("OTP expired for email:", email);
        await Otp.deleteOne({ email }); // Remove expired OTP
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          error: "OTP has expired. Please request a new one.",
        });
      }
  
      // Update user's `isVerified` status
      const user = await User.findOneAndUpdate(
        { email },
        { isVerified: true },
        { new: true }
      );
  
      if (!user) {
        console.log("User not found for email:", email);
        return res.render("user/verifyemail", {
          title: "Verify Email",
          email,
          error: "User not found.",
        });
      }
  
      // Delete OTP record after successful verification
      await Otp.deleteOne({ email });
  
     return res.redirect("/login");
  
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.render("user/verifyemail", {
        title: "Verify Email",
        email,
        error: "Something went wrong! Please try again.",
      });
    }
  };
  // resendOtp2 = async (req, res) => {
  //   try {
  //     const { email } = req.body;
  
  //     // Check if user exists
  //     const user = await User.findOne({ email });
  //     if (!user) {
  //       req.flash("error", "User not found!");
  //       return res.render("user/verifyemail", {
  //         title: "Verify Email",
  //         email,
  //         error: "Something went wrong! Please try again.",
  //         message:"verify otp"
  //       });
  //     }
  
  //     // Generate and store new OTP
  //     const newOtp = generateOTP();
  //     await Otp.findOneAndUpdate(
  //       { email },
  //       { otp: newOtp, createdAt: Date.now() },
  //       { upsert: true, new: true }
  //     );
  
  //     // Send OTP via email
  //     await transporter.sendMail({
  //       from: process.env.EMAIL_USER,
  //       to: email,
  //       subject: "Your New OTP Code",
  //       text: `Your new OTP is ${newOtp}. It will expire in 10 minutes.`,
  //     });
  
  //     req.flash("success", "New OTP sent! Please check your email.");
  //     return res.render("user/verifyemail", {
  //       title: "Verify Email",
  //       email,
  //       error: "Something went wrong! Please try again.",
  //       message:"verify otp"
  //     });
  //   } catch (error) {
  //     console.error("Error resending OTP:", error);
  //     req.flash("error", "Something went wrong! Please try again.");
  //     return res.render("user/verifyemail", {
  //       title: "Verify Email",
  //       email,
  //       error: "Something went wrong! Please try again.",
  //       message:"verify otp"
  //     });
  //   }
  // };
  
 resendOtp = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "User not found!");
        return res.render("user/paswordVerify",{
          title:"verify otp",
          email,
          userId: null,
          message:"verify otp"
        });
      }
  
      // Generate and store new OTP
      const newOtp = generateOTP();
      await Otp.findOneAndUpdate(
        { email },
        { otp: newOtp, createdAt: Date.now() },
        { upsert: true, new: true }
      );
  
      // Send OTP via email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your New OTP Code",
        text: `Your new OTP is ${newOtp}. It will expire in 10 minutes.`,
      });
  
      req.flash("success", "New OTP sent! Please check your email.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      req.flash("error", "Something went wrong! Please try again.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    }
  };
  

  // Login
 login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
      }
  
      if (!user.isVerified) {
        req.flash("error", "Your account is not verified. Please check your email.");
        return res.redirect("/login");
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
      }
  
      // Generate JWT Token
      const token = jwt.sign(
        { id: user._id, username: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      // Set token in HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 48 * 60 * 60 * 1000, // 2 days
      });
  
      // Now, manually set req.user since login is creating a new session
      req.user = user;
  
      const users = new mongoose.Types.ObjectId(user._id);
  
      // Check if user has a registration record
      const registration = await Registration.findOne({ userId: users });
  
      if (!registration) {
        req.flash("info", "Please complete your registration.");
        return res.redirect("/registration");
      } else {
        req.flash("success", "Login successful!");
        if (req.user.role === "student") {
          return res.redirect("/listingoftutor");
        } else if (req.user.role === "tutor") {
          return res.redirect("/listingofstudent");
        } else {
          return res.redirect("/scearch");
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/login");
    }
  };
  
  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        req.flash("error", "Email is required.");
        return res.redirect("/forgot-password");
      }
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "No account found with this email.");
        return res.redirect("/forgot-password");
      }
  
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      
      // Store OTP in a separate OTP collection with a 5-minute expiry
      await Otp.create({ email, otp, createdAt: new Date() });
  
      // Send OTP via email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
      };
  
      await transporter.sendMail(mailOptions);
  
      req.flash("success", "OTP sent to your email. Please check your inbox.");
      
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
  
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/forgot-password");
    }
  };
  
  

// Verify OTP
verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      req.flash("error", "Email and OTP are required.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    }

    // Find OTP record in the OTP collection
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      req.flash("error", "Invalid OTP or email.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    }

    // Check if OTP is valid and not expired (valid for 10 minutes)
    const isOtpExpired = otpRecord.createdAt.getTime() < Date.now() - 10 * 60 * 1000;

    if (otpRecord.otp !== otp || isOtpExpired) {
      req.flash("error", "OTP is incorrect or expired.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    }

    // Delete OTP from DB (since it's one-time use)
    await Otp.deleteOne({ email });

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "User not found.");
      return res.render("user/paswordVerify",{
        title:"verify otp",
        email,
        userId: null,
        message:"verify otp"
      });
    }

    // Generate a JWT token for password reset (expires in 10 minutes)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    req.flash("success", "OTP verified. Please reset your password.");
    res.render("user/resetpassword",{
      title:"verify otp",
        email,
        token,
        userId: null,
        message:"verify otp"
    })

  } catch (error) {
    console.error("Error in verifyOtp:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.render("user/paswordVerify",{
      title:"verify otp",
      email,
      userId: null,
      message:"verify otp"
    });
  }
};

// Reset Password
 resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      req.flash("error", "Invalid or expired reset link.");
      res.render("user/resetpassword",{
        title:"verify otp",
          email,
          token,
          userId: null,
          message:"verify otp"
      })
    }

    if (!newPassword || !confirmPassword) {
      req.flash("error", "Please enter a new password.");
      res.render("user/resetpassword",{
        title:"verify otp",
          email,
          token,
          userId: null,
          message:"verify otp"
      })
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      res.render("user/resetpassword",{
        title:"verify otp",
          email,
          token,
          userId: null,
          message:"verify otp"
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    req.flash("success", "Password reset successful. Please log in.");
    return res.redirect("/login");

  } catch (error) {
    console.error("Error in resetPassword:", error);
    req.flash("error", "Invalid or expired token.");
    return res.redirect("/forgot-password");
  }
};


logout = (req, res) => {
  res.clearCookie("token"); // Clear the JWT token cookie
  req.flash("success", "You have been logged out successfully!");
  res.redirect("/login");
};


}

module.exports = new UserAuthController();
