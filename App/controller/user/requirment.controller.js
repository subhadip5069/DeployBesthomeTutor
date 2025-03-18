const Registration = require("../../model/registration");
const nodemailer = require("nodemailer");
const User = require("../../model/user.model");
const { default: mongoose } = require("mongoose");




const sendEmails = async (userEmail, requirement) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, // Admin's email
            pass: process.env.EMAIL_PASS, // Admin's email password
        },
    });

    const adminEmail = process.env.ADMIN_EMAIL;

    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Tuition Requirement Submitted Successfully",
        html: `
            <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;">
                <h2 style="color: #007bff; text-align: center;">Tuition Requirement Submitted</h2>
                <p>Dear User,</p>
                <p>Your tuition requirement has been successfully submitted.</p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <p><strong>📍 Location:</strong> ${requirement.tuitionLocation}</p>
                    <p><strong>⏰ Preferred Time:</strong> ${requirement.preferredTime}</p>
                </div>
                <p>Thank you for using our platform!</p>
            </div>
        `,
    };
    
    const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: "New Tuition Requirement Submitted",
        html: `
            <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545; text-align: center;">New Tuition Requirement</h2>
                <p>Dear Admin,</p>
                <p>A new tuition requirement has been submitted by a user.</p>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                    <p><strong>🆔 User ID:</strong> ${requirement.userId}</p>
                    <p><strong>📍 Location:</strong> ${requirement.tuitionLocation}</p>
                    <p><strong>⏰ Preferred Time:</strong> ${requirement.preferredTime}</p>
                </div>
                <p>Login to the admin panel to review.</p>
            </div>
        `,
    };
    

    await transporter.sendMail(userMailOptions);

    await transporter.sendMail(adminMailOptions);
};

class TuitionController {


    // Create Tuition Requirement (Student)
  
    async createTuitionRequirement(req, res) {
        try {
            if (req.user.role === "student") {
                const registrations = await Registration.find({ userId: req.user._id });
                if (registrations.length > 0) {
                    req.session.message = { type: "info", text: "You are already registered. Redirecting to the tutor list." };
                    return res.redirect("/listofTutor");
                }
            } else if (req.user.role === "tutor") {
                const registrations = await Registration.find({ userId: req.user._id });
                if (registrations.length > 0) {
                    req.session.message = { type: "info", text: "You are already registered. Redirecting to the student list." };
                    return res.redirect("/listofStudents");
                }
            }
    
            const { tuitionLocation, preferredTime, preferredTutor, state, city, pincode, locality, subject, class: className, userId, board } = req.body;
    
            // Find user email based on userId
            const user = await User.findById(userId);
            if (!user) {
                req.session.message = { type: "error", text: "User not found. Please log in." };
                return res.redirect('/login');
            }
    
            const newRequirement = new Registration({
                userId,
                tuitionLocation,
                preferredTime,
                preferredTutor,
                state,
                city,
                pincode,
                locality,
                subject,
                class: className.trim(),
                board,
                status: "active",
            });
    
            await newRequirement.save();
    
            // Send Email Notifications
            await sendEmails(user.email, newRequirement);
    
            req.session.message = { type: "success", text: "Your tuition requirement has been successfully submitted." };
            return res.redirect('/listingoftutor');
        } catch (error) {
            console.error("Error saving tuition requirement:", error);
            req.session.message = { type: "error", text: "Something went wrong. Please try again." };
            return res.redirect('/login');
        }
    }
    


    createRegistration = async (req, res) => {
        try {
            console.log("Received req.body:", req.body);
            console.log("Received req.user:", req.user);
    
            const {
                userId, // Expecting userId from req.body
                tuitionLocation,
                preferredTime,
                preferredTutor,
                state,
                city,
                pincode,
                locality,
                subject,
                about,
                sorted,
                experience,
                qualification,
                board,
                age,
                class: className // Handles class input
            } = req.body;
    
            // Determine userId (from req.body or req.user)
            const validUserId = userId || (req.user ? req.user.id : null);
    
            // Validate userId
            if (!validUserId || !mongoose.Types.ObjectId.isValid(validUserId)) {
                console.error("Invalid userId received:", validUserId);
                req.session.message = { type: "error", text: "Invalid user ID. Please log in again." };
                return res.redirect("/login");
            }
    
            // Check if user exists
            const user = await User.findById(validUserId);
            if (!user) {
                req.session.message = { type: "error", text: "User not found. Please log in." };
                return res.redirect("/login");
            }
    
            // Ensure class is always an array
            const formattedClass = Array.isArray(className)
                ? className.map(c => c.trim())  // If already an array, trim each value
                : className 
                    ? className.split(",").map(c => c.trim()).filter(Boolean)  // If a string, split into array
                    : []; // Default to empty array if undefined
    
            // Handle file uploads (if files exist)
            const attachedFiles = req.files
                ? req.files.map((file) => ({
                    fileType: req.body.fileType || "Other",
                    filePath: file.path,
                }))
                : [];
    
            // Create a new registration
            const registration = new Registration({
                userId: validUserId,
                tuitionLocation,
                preferredTime,
                preferredTutor,
                state,
                city,
                pincode,
                locality,
                subject,
                about,
                sorted,
                experience,
                qualification,
                board,
                age,
                class: formattedClass, // Ensures class is stored correctly
                attachedFiles,
            });
    
            await registration.save();
            await sendEmails(user.email, registration);
    
            req.session.message = { type: "success", text: "Registration successful! You will be contacted soon." };
            res.redirect("/listingofstudent");
        } catch (error) {
            console.error("Error in createRegistration:", error);
            req.session.message = { type: "error", text: "Something went wrong. Please try again." };
            res.status(500).redirect("/login");
        }
    };
    
    
    
    
    // Update Tuition Requirement (for students)
async updateTuitionRequirement(req, res) {
    try {
        const { requirementId } = req.params.id;
        const {
            tuitionLocation,
            preferredTime,
            state,
            city,
            pincode,
            locality,
            subject,
            class: className,
            board,
            
        } = req.body;

        // Find and update the requirement
        const updatedRequirement = await Registration.findByIdAndUpdate(
            {_id: new mongoose.Types.ObjectId(req.params.id)},
            {
                tuitionLocation,
            preferredTime,
            state,
            city,
            pincode,
            locality,
            subject,
            class: className,
            board,
            status:"active"
            },
            { new: true }
        );
        console.log(updatedRequirement);
        if (!updatedRequirement) {
            res.redirect("/myprofile");
        }

        res.redirect("/listingoftutor"); // Redirect after success
    } catch (error) {
        console.error("Error updating tuition requirement:", error);
        res.redirect('/myprofile');
    }
}

// Update Registration (for tutors)


updateRegistration=async(req, res)=> {
    try {
        const { registrationId } = req.params; // Corrected destructuring
        const {
            tuitionLocation,
                preferredTime,
            
                state,
                city,
                pincode,
                locality,
                subject,
                about,
               
                sorted,
                experience,
                qualification,
              
                age
        } = req.body;

        // Find the existing registration
        const existingRegistration = await Registration.findById(req.params.id);
        if (!existingRegistration) {
            res.redirect("/myprofile");
        }

        // Find the user associated with the registration
        const user = await User.findById(existingRegistration.userId);
        if (!user) {
           res.redirect("/login");
        }

        // Check if a new profile image is uploaded
        if (req.file) {
            // Delete the old image if it exists
            if (user.profileimage && fs.existsSync(user.profileimage)) {
                fs.unlinkSync(user.profileimage);
            }

            // Save the new image path
            user.profileImage = req.file.path;
            await user.save(); // Update the user document
        }

        // Update the registration details
        const updatedRegistration = await Registration.findByIdAndUpdate(
            {_id: new mongoose.Types.ObjectId(req.params.id)},
            {
                tuitionLocation,
                preferredTime,
            
                state,
                city,
                pincode,
                locality,
                subject,
                about,
               
                sorted,
                experience,
                qualification,
              status: "active",
                age
            },
            { new: true }
        );

        if (!updatedRegistration) {
            res.redirect("/myprofile");
        }

        res.redirect("/listingofstudent"); // Redirect after success
    } catch (error) {
        console.error("Error updating registration:", error);
        res.redirect('/myprofile');
    }
}




    // Get All Tuition Requirements for Tutors
    async getAllTuitionRequirements(req, res) {
        try {
            const requirements = await Registration.find({ sorted: "No" }).populate("userId", "name email");
                
        } catch (error) {
            return res.status(500).json({ message: "Error fetching tuition requirements", error });
        }
    }

    // Mark a Tuition Requirement as Sorted (Tutor Accepts)
    async markAsSorted(req, res) {
        try {
            const updatedRequirement = await Registration.findByIdAndUpdate(
                req.params.id,
                { sorted: "Yes" },
                { new: true }
            );

            if (!updatedRequirement) {
                return res.status(404).json({ message: "Requirement not found" });
            }

            return res.status(200).json({ message: "Marked as sorted", updatedRequirement });
        } catch (error) {
            return res.status(500).json({ message: "Error updating requirement", error });
        }
    }


    updatedtuition = async (req, res) => {
        try{
            const userId = req.user.userId;
            const id = req.params.id;
        //   if current status active then change to inactive
        // if current status inactive then not change to active 

            const status = req.body.status;
            const updatedRegistration = await Registration.findByIdAndUpdate(id, { status }, { new: true });
            if (!updatedRegistration) {
                req.session.message = { type: "error", text: "Something went wrong. Please try again." };
                return res.redirect("/myprofile");
            }
             req.session.message = { type: "error", text: "Thank you for your response." };
             return res.redirect("/myprofile");
        } catch (error) {
             req.session.message = { type: "error", text: "Something went wrong. Please try again." };
             return res.redirect("/myprofile");

        }
    }
}

module.exports = new TuitionController();
