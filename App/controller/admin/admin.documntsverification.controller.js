
const Registration = require("../../model/registration");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS 
    },
});


class Documentverificationcontroller{
    updateDocumentVerification = async (req, res) => {
        try {
            const userId = req.user;
            const registrationId = req.params.id;
    
            console.log("Received registrationId:", registrationId);
    
            if (!mongoose.Types.ObjectId.isValid(registrationId)) {
                console.error("Invalid Registration ID:", registrationId);
                
            }
    
            const registration = await Registration.findById(registrationId).populate("userId", "email name");
    
            if (!registration) {
                console.error("Registration not found");
                return res.redirect("/admin/documentverification");
            }
    
            // Toggle document verification status
            registration.status = registration.status === "active" ? "inactive" : "active";
            await registration.save();
    
            // Send email to the user
            const mailOptions = {
                from: "noreply@gmail.com",
                to: registration.userId.email,
                subject: "Document Verification Status Updated",
                text: `Hello ${registration.userId.name},\n\nYour document verification status has been updated to: ${registration.status}.\n\nIf you have any questions, please contact support.\n\nBest regards,\nYour Company Name`,
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                } else {
                    console.log("Email sent:", info.response);
                }
            });
    
            res.redirect("/admin/documentverification");
        } catch (error) {
            console.error("Error updating document verification status:", error);
            res.redirect("/admin/documentverification");
        }
    };
    
}

module.exports=new Documentverificationcontroller();

