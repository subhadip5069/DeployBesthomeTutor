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
        html: `<p>Dear User,</p>
               <p>Your tuition requirement has been successfully submitted.</p>
               <p><strong>Location:</strong> ${requirement.tuitionLocation}</p>
               <p><strong>Preferred Time:</strong> ${requirement.preferredTime}</p>
               <p>Thank you for using our platform!</p>`,
    };

    const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: "New Tuition Requirement Submitted",
        html: `<p>Dear Admin,</p>
               <p>A new tuition requirement has been submitted by a user.</p>
               <p><strong>User ID:</strong> ${requirement.userId}</p>
               <p><strong>Location:</strong> ${requirement.tuitionLocation}</p>
               <p><strong>Preferred Time:</strong> ${requirement.preferredTime}</p>
               <p>Login to the admin panel to review.</p>`,
    };

    await transporter.sendMail(userMailOptions);

    await transporter.sendMail(adminMailOptions);
};

class TuitionController {


    // Create Tuition Requirement (Student)
  
    async createTuitionRequirement(req, res) {
        try {
            if (req.user.role === "student") {
                //    if exist refistration show listof tutor
                    const registrations = await Registration.find({ userId: req.user._id });
                    if (registrations.length > 0) {
                        res.redirect("/listofTutor");
                    }
    
                }else if (req.user.role === "tutor") {
                    // if exist registration show listof student
                    const registrations = await Registration.find({ userId: req.user._id });
                    if (registrations.length > 0) {
                        res.redirect("/listofStudents");
                    }
                }else{
                    
                }
    
            const { tuitionLocation, preferredTime, preferredTutor, feeType, feeAmount, state, city, pincode, locality, subject, class: className, userId , board,status} = req.body;
    
            // Find user email based on userId
            const user = await User.findById(userId);
            if (!user) {
                res.redirect('/login');
            }
    
            const newRequirement = new Registration({
                userId,
                tuitionLocation,
                preferredTime,
                preferredTutor,
                feeType,
                feeAmount,
                state,
                city,
                
                pincode,
                locality,
                subject,
                class: className,
                board,
                status:"active",
            });
    
            await newRequirement.save();
    
            // Send Email Notifications
            await sendEmails(user.email, newRequirement);
    
            return res.redirect('/listingoftutor');
        } catch (error) {
            console.error("Error saving tuition requirement:", error);
            return res.redirect('/login');
        }
    }
    createRegistration =async (req, res) => {
       
        
        
        try {
            // if exists user role student and status active show listof tutor

           

          const {
            userId,
            tuitionLocation,
            preferredTime,
            preferredTutor,
            feeType,
            feeAmount,
            state,
            city,
            pincode,
            locality,
            subject,
            about,
            class: classLevel,
            sorted,
            experience,
            qualification,
            board,
            age
          } = req.body;
        //   if already exists
          
          const user = await User.findById(userId);
          if (!user) {
            return res.redirect("/login");
          }
          const attachedFiles = req.files.map((file) => ({
            fileType: req.body.fileType || "Other",
            filePath: file.path,
          }));

      
          const registration = new Registration({
            userId,
            tuitionLocation,
            preferredTime,
            preferredTutor,
            feeType,
            feeAmount,
            state,
            city,
            board,
            about,
            pincode,
            locality,
            subject,
            class: classLevel,
            sorted,
            attachedFiles,
            experience,
            qualification,
            age
          });
      
          await registration.save();
          await sendEmails(user.email, registration);
          res.redirect("/listingofstudent"); // Redirect after success
        } catch (error) {
          console.error(error);
          res.redirect("/login");
        }
      };
    
    
    
    // Update Tuition Requirement (for students)
async updateTuitionRequirement(req, res) {
    try {
        const { requirementId } = req.params.id;
        const {
            tuitionLocation,
            preferredTime,
            preferredTutor,
            feeType,
            feeAmount,
            state,
            city,
            pincode,
            locality,
            subject,
            class: className,
            board,
            status
        } = req.body;

        // Find and update the requirement
        const updatedRequirement = await Registration.findByIdAndUpdate(
            {_id: new mongoose.Types.ObjectId(req.params.id)},
            {
                tuitionLocation,
                preferredTime,
                preferredTutor,
                feeType,
                feeAmount,
                state,
                city,
                pincode,
                locality,
                subject,
                class: className,
                board,
                status
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
            preferredTutor,
            feeType,
            feeAmount,
            state,
            city,
            pincode,
            locality,
            subject,
            about,
            class: classLevel,
            sorted,
            experience,
            qualification,
            board,
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
            user.profileimage = req.file.path;
            await user.save(); // Update the user document
        }

        // Update the registration details
        const updatedRegistration = await Registration.findByIdAndUpdate(
            {_id: new mongoose.Types.ObjectId(req.params.id)},
            {
                tuitionLocation,
                preferredTime,
                preferredTutor,
                feeType,
                feeAmount,
                state,
                city,
                pincode,
                locality,
                subject,
                about,
                class: classLevel,
                sorted,
                experience,
                qualification,
                board,
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
}

module.exports = new TuitionController();
