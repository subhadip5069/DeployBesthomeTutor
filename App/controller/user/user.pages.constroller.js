const mongoose = require("mongoose");
const Registration = require("../../model/registration");
const User = require("../../model/user.model");
const PurchasePlan = require("../../model/purchaceplane");


class userPagesController {

    index=async(req, res)=>{
        try {
            const userId = req.user;
            const message = req.session.message;
        req.session.message = null;
        res.render("user/index",{
            title:"/ Home",
            user: userId,
            userId,
            message

        });
    } catch (error) {
        res.redirect("/")
        
    }
    }

    register(req, res) {
        const userId = null;
        const message = req.session.message;
        req.session.message = null;
        res.render("user/register",{
            title:"/ Register",
            message,
            userId
        });
    }
    login(req, res) {
        const message = req.session.message;
        req.session.message = null;
        res.render("user/login", {
            title: "/ Login",
             message,
            userId: null
        });
    }
    
    
  registration = async (req, res) => {
        try {
          const userId = req.user?.userId; // Extract userId properly
          const message = req.session.message;
          req.session.message = null;
      
          // Validate userId
          if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid userId received:", userId);
            return res.redirect("/register");
          }
      
          console.log("User ID:", userId);
      
          // Fetch user from database
          const user = await User.findById(userId);
      
          if (!user) {
            console.error("User not found for ID:", userId);
            return res.redirect("/register");
          }
      
          res.render("user/registration", {
            title: "Registration",
            userId,
            user,
            message,
          });
        } catch (error) {
          console.error("Error in registration:", error);
          res.status(500).redirect("/register");
        }
      };
      
       editregistration = async (req, res) => {
        try {
            const userId = req.user?.userId; // Ensure correct userId extraction
            console.log("userId:", userId);
    
            const registrationId = req.params.id;
            console.log("registrationId:", registrationId);
    
            // Validate userId before using it
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                console.error("Invalid userId:", userId);
                req.flash("error_msg", "Invalid user ID.");
                return res.redirect("/registration");
            }
    
            // Validate registrationId before using it
            if (!mongoose.Types.ObjectId.isValid(registrationId)) {
                console.error("Invalid registrationId:", registrationId);
                req.flash("error_msg", "Invalid registration ID.");
                return res.redirect("/registration");
            }
    
            // Fetch user details
            const user = await User.findById(userId).lean();
            if (!user) {
                console.error("User not found:", userId);
                req.flash("error_msg", "User not found.");
                return res.redirect("/registration");
            }
    
            // Fetch registration details
            const registration = await Registration.findById(registrationId)
                .populate("userId", "profileimage")
                .lean();
    
            if (!registration) {
                console.error("Registration not found:", registrationId);
                req.flash("error_msg", "Registration not found.");
                return res.redirect("/registration");
            }
    
            console.log("Fetched Registration:", registration);
    
            // Render the update registration page
            res.render("user/updateregistration", {
                title: "/ Update Registration",
                userId,
                user,
                registration,
                success_msg: req.flash("success_msg"),
                error_msg: req.flash("error_msg"),
            });
    
        } catch (error) {
            console.error("Error in editregistration:", error);
            req.flash("error_msg", "Something went wrong.");
            if (!res.headersSent) res.redirect("/registration"); // Avoid duplicate redirects
        }
    };
    
    
    
    
   
    
    
    listingofstudent = async (req, res) => {
        try {
            const userId = req.user;
            const roleToFetch = "student"; // Fetch only students
    
            let {
                classFilter,
                subjectFilter,
                preferredTutor,
                state,
                city,
                pincode,
                priceRange,
                page = 1,
                limit = 21,
                searchQuery
            } = req.query;
    
            page = parseInt(page);
            limit = parseInt(limit);
            const skip = (page - 1) * limit;
    
            let registrationFilter = {};
            let userFilter = { role: roleToFetch };
    
            if (classFilter) {
                registrationFilter.class = { $in: classFilter.split(",").map(c => c.trim()) };
            }
            if (subjectFilter) {
                registrationFilter.subject = { $in: subjectFilter.split(",").map(s => s.trim()) };
            }
            if (preferredTutor) {
                registrationFilter.preferredTutor = preferredTutor.trim();
            }
            if (state) {
                registrationFilter.state = { $regex: state.trim(), $options: "i" };
            }
            if (city) {
                registrationFilter.city = { $regex: city.trim(), $options: "i" };
            }
            if (pincode && !isNaN(pincode)) {
                registrationFilter.pincode = Number(pincode);
            }
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split("-").map(Number);
                if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                    registrationFilter.feeAmount = { $gte: minPrice, $lte: maxPrice };
                }
            }
    
            if (searchQuery) {
                const regex = new RegExp(searchQuery.trim(), "i");
    
                registrationFilter.$or = [
                    { tuitionLocation: regex },
                    { preferredTime: regex },
                    { preferredTutor: regex },
                    { feeType: regex },
                    { state: regex },
                    { city: regex },
                    { locality: regex },
                    { subject: regex },
                    { class: regex },
                    { board: regex },
                    { qualification: regex }
                ];
    
                if (!isNaN(searchQuery)) {
                    registrationFilter.$or.push(
                        { pincode: Number(searchQuery) },
                        { experience: Number(searchQuery) },
                        { age: Number(searchQuery) }
                    );
                }
    
                // **Search by randomId inside userId**
                userFilter.randomId = regex;
            }
    
            // Count total matching students for pagination
            const totalStudents = await Registration.countDocuments(registrationFilter);
            const totalPages = Math.ceil(totalStudents / limit);
    
            // Fetch paginated student registrations
            let requirements = await Registration.find(registrationFilter)
                .populate({
                    path: "userId",
                    select: "name role randomId",
                    match: userFilter // Ensures search by `randomId`
                })
                .skip(skip)
                .limit(limit)
                .lean();
    
            // Filter out registrations that have no associated user
            requirements = requirements.filter(req => req.userId);
            const message = req.session.message;
            req.session.message = null;
            // **Flash messages for better UX**
            if (requirements.length === 0) {
                req.flash("error_msg", "No students found matching your search criteria.");
            } else {
                req.flash("success_msg", "Students retrieved successfully.");
            }
    
            res.render("user/listingofstudent", {
                title: "/ Students",
                
                userId,
                requirements,
                requirement: requirements,
                currentPage: page,
                message,
                totalPages,
                filters: {
                    classFilter: classFilter || "",
                    subjectFilter: subjectFilter || "",
                    preferredTutor: preferredTutor || "",
                    state: state || "",
                    city: city || "",
                    pincode: pincode || "",
                    priceRange: priceRange || "",
                    searchQuery: searchQuery || "",
                },
                success_msg: req.flash("success_msg"),
                error_msg: req.flash("error_msg"),
            });
        } catch (error) {
            console.error("Error in listingofstudent:", error);
            req.flash("error_msg", "An error occurred while fetching students.");
            res.redirect("/listingofstudent");
        }
    };
    
    
    
    
    listingoftutor = async (req, res) => {
        try {
            const userId = req.user;
            const roleToFetch = "tutor";
    
            let {
                classFilter,
                subjectFilter,
                preferredTutor,
                state,
                city,
                pincode,
                priceRange,
                page = 1,
                limit = 15,
                searchQuery
            } = req.query;
    
            page = parseInt(page);
            limit = parseInt(limit);
            const skip = (page - 1) * limit;
    
            let registrationFilter = { status: "active" }; // Ensure only active tutors are fetched
    
            if (classFilter) {
                registrationFilter.class = { $in: classFilter.split(",").map(c => c.trim()) };
            }
            if (subjectFilter) {
                registrationFilter.subject = { $in: subjectFilter.split(",").map(s => s.trim()) };
            }
            if (preferredTutor) {
                registrationFilter.preferredTutor = preferredTutor.trim();
            }
            if (state) {
                registrationFilter.state = { $regex: state.trim(), $options: "i" };
            }
            if (city) {
                registrationFilter.city = { $regex: city.trim(), $options: "i" };
            }
            if (pincode && !isNaN(pincode)) {
                registrationFilter.pincode = Number(pincode);
            }
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split("-").map(Number);
                if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                    registrationFilter.feeAmount = { $gte: minPrice, $lte: maxPrice };
                }
            }
    
            let userFilter = { role: roleToFetch };
    
            if (searchQuery) {
                const regex = new RegExp(searchQuery.trim(), "i");
    
                registrationFilter.$or = [
                    { tuitionLocation: regex },
                    { preferredTime: regex },
                    { preferredTutor: regex },
                    { feeType: regex },
                    { state: regex },
                    { city: regex },
                    { locality: regex },
                    {pincode: regex},
                    { subject: regex },
                    { class: regex },
                    { board: regex },
                    { qualification: regex }
                ];
    
                if (!isNaN(searchQuery)) {
                    registrationFilter.$or.push(
                        { pincode: Number(searchQuery) },
                        { experience: Number(searchQuery) },
                        { age: Number(searchQuery) }
                    );
                }
    
                // **Filter by randomId directly inside userId**
                userFilter.randomId = regex;
            }
    
            const totalTutors = await Registration.countDocuments(registrationFilter);
            const totalPages = Math.ceil(totalTutors / limit);
    
            let registrations = await Registration.find(registrationFilter)
                .populate({
                    path: "userId",
                    select: "name role randomId",
                    match: userFilter // Filter `randomId` inside user
                })
                .skip(skip)
                .limit(limit)
                .lean();
                const requirement = await Registration.find({ status: "active" })
                .populate("userId")
                .lean();
            // Remove tutors without associated user data
            registrations = registrations.filter(reg => reg.userId);
    
            // Flash message if no results found
            if (registrations.length === 0) {
                req.flash("error_msg", "No tutors found matching your search criteria.");
            } else {
                req.flash("success_msg", "Tutors retrieved successfully.");
            }
            const message = req.session.message;
            req.session.message = null;
            res.render("user/listoftutor", {
                title: "/ Tutors",
                userId,
                requirement,
                registrations,
                currentPage: page,
                totalPages,
                message,
                filters: {
                    classFilter: classFilter || "",
                    subjectFilter: subjectFilter || "",
                    preferredTutor: preferredTutor || "",
                    state: state || "",
                    city: city || "",
                    pincode: pincode || "",
                    priceRange: priceRange || "",
                    searchQuery: searchQuery || "",
                },
                success_msg: req.flash("success_msg"),
                error_msg: req.flash("error_msg"),
            });
        } catch (error) {
            console.error("Error in listingoftutor:", error);
            req.flash("error_msg", "An error occurred while fetching tutors.");
            res.redirect("/listingoftutor");
        }
    };
    
    
    
    
    
  
    
     filterList = async (req, res) => {
        try {
            const userId = req.user;
            const roleToFetch = "student"; // Fetch opposite role
    
            // Extract filters from query parameters
            let { classFilter, subjectFilter, gender, state, city, pincode, minPrice, maxPrice, page } = req.query;
            page = parseInt(page) || 1;
            let limit = 5;
            let skip = (page - 1) * limit;
    
            // Construct filter object
            let filter = { role: roleToFetch };
    
            if (classFilter) filter.class = { $in: Array.isArray(classFilter) ? classFilter : classFilter.split(",") };
            if (subjectFilter) filter.subject = { $in: Array.isArray(subjectFilter) ? subjectFilter : subjectFilter.split(",") };
            if (gender) filter.gender = gender.trim();
            if (state) filter.state = new RegExp(state.trim(), "i");
            if (city) filter.city = new RegExp(city.trim(), "i");
            if (pincode) filter.pincode = new RegExp(pincode.trim(), "i");
    
            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = parseFloat(minPrice);
                if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
            }
    
            // Fetch tutors with filters & pagination
            const [users, totalUsers] = await Promise.all([
                User.find(filter).skip(skip).limit(limit).lean(),
                User.countDocuments(filter)
            ]);
    
            const totalPages = Math.ceil(totalUsers / limit);
    
            // Fetch requirements specific to the logged-in user
            const userIds = users.map(user => user._id);
            const requirement = await Registration.find(filter  ) // Ensure userId is not null
                 .populate({
                    path: "userId",
                    select: "name role randomId",
                    match: { role: "tutor" }, // Make sure this matches actual roles in DB
                        })
                     .lean();

            console.log("Filtered Requirement Data:", requirement);
            // ✅ Filter out null userId values
            // ✅ Works fine
    
            console.log("Requirement Data:", requirement);

            res.render("user/listing", {
                title: "/ Listing",
                userId,
                requirement,
                users,
                role: req.user.role,
                currentPage: page,
                totalPages,
                filters: { classFilter, subjectFilter, gender, state, city, pincode, minPrice, maxPrice },
                success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            });
        } catch (error) {
            console.error("Error in filterList:", error);
            res.status(500).send("Internal Server Error");
        }
    };
    
    
    
    listing = async (req, res) => {
        try {
            let userId = req.user || null;
            let roleToFetch = null; // Default to null to fetch all users
    
            if (req.user && req.user.role) {
                // Fetch the opposite role
                roleToFetch = req.user.role === "tutor" ? "student" : "tutor";
            }
    
            let {
                classFilter, subjectFilter, preferredTutor, state, city, pincode,
                priceRange, searchQuery, page = 1
            } = req.query;
    
            page = parseInt(page);
            let limit = 5;
            let skip = (page - 1) * limit;
    
            // ✅ Build User Filter
            let userFilter = roleToFetch ? { role: roleToFetch } : {};
    
            // ✅ Build Registration Filter
            let registrationFilter = { status: "active" }; // Only fetch active tutors
    
            if (classFilter) {
                registrationFilter.class = { $in: classFilter.split(",").map(c => c.trim()) };
            }
            if (subjectFilter) {
                registrationFilter.subject = { $in: subjectFilter.split(",").map(s => s.trim()) };
            }
            if (preferredTutor) {
                registrationFilter.preferredTutor = preferredTutor.trim();
            }
            if (state) {
                registrationFilter.state = { $regex: state.trim(), $options: "i" };
            }
            if (city) {
                registrationFilter.city = { $regex: city.trim(), $options: "i" };
            }
            if (pincode && !isNaN(pincode)) {
                registrationFilter.pincode = Number(pincode);
            }
            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split("-").map(Number);
                if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                    registrationFilter.feeAmount = { $gte: minPrice, $lte: maxPrice };
                }
            }
    
            // ✅ Apply Search Query
            if (searchQuery) {
                const regex = new RegExp(searchQuery.trim(), "i");
                registrationFilter.$or = [
                    { tuitionLocation: regex },
                    { preferredTime: regex },
                    { preferredTutor: regex },
                    { feeType: regex },
                    { state: regex },
                    { city: regex },
                    { locality: regex },
                    { subject: regex },
                    { class: regex },
                    { board: regex },
                    { qualification: regex }
                ];
    
                if (!isNaN(searchQuery)) {
                    registrationFilter.$or.push(
                        { pincode: Number(searchQuery) },
                        { experience: Number(searchQuery) },
                        { age: Number(searchQuery) }
                    );
                }
            }
    
            // ✅ Count Total Matching Registrations (for Pagination)
            let totalUsers = await Registration.countDocuments(registrationFilter);
            let totalPages = Math.ceil(totalUsers / limit);
    
            // ✅ Fetch Registrations with Applied Filters
            let registrations = await Registration.find(registrationFilter)
                .populate({ path: "userId", match: userFilter, select: "name email role" }) // Apply user filter inside populate
                .skip(skip)
                .limit(limit)
                .lean();
    
            // ✅ Remove Entries Where userId is Not Populated
            registrations = registrations.filter(reg => reg.userId);
    
            res.render("user/listing", {
                title: "/  Listing",
                userId,
                requirement: registrations,
                role: req.user ? req.user.role : null, // Pass null if no user
                currentPage: page,
                totalPages,
                filters: {
                    classFilter, subjectFilter, preferredTutor, state, city, pincode, priceRange, searchQuery
                },
                success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            });
    
        } catch (error) {
            console.error("Error in listing tutors:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
    
    
    

    // primum
    primum=async(req,res)=>{
        try {
            const userId = req.user || null;
            if(userId == null  || userId == undefined ){
                res.redirect("/login")
            }
            const plans = await PurchasePlan.find().lean();
            res.render("user/primum",{
                title:"/ Premium",
                user:req.user,
                userId,
                plans,
                success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            });
        } catch (error) {
            console.error(error);
            res.redirect("/login")
        }
    }



    //const profile
    myprofile = async (req, res) => {
        try {
            const userId = req.user?.userId; // Extract correct userId
    
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                console.error("Invalid userId:", userId);
                return res.redirect("/login");
            }
    
            // Fetch user data
            const user = await User.findById(userId).lean();
            if (!user) {
                console.error("User not found:", userId);
                return res.redirect("/login");
            }
    
            // Fetch user requirement
            const requirement = await Registration.findOne({ userId: new mongoose.Types.ObjectId(userId) })
                .populate("userId", "name email randomId")
                .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age about")
                .lean();
    
            // Pagination setup
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 3;
            const skip = (page - 1) * limit;
    
            // Convert unlocked student/tutor IDs into ObjectId array
            const studentIds = (user.unlockedStudents || []).filter(mongoose.Types.ObjectId.isValid).map(id => new mongoose.Types.ObjectId(id));
            const teacherIds = (user.unlockedTutors || []).filter(mongoose.Types.ObjectId.isValid).map(id => new mongoose.Types.ObjectId(id));
            const allIds = [...studentIds, ...teacherIds]; // Combine both arrays
    
            // Fetch orders based on unlocked IDs
            const orders = await Registration.find({ _id: { $in: allIds } })
                .populate("userId", "name email randomId")
                .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age")
                .skip(skip)
                .limit(limit)
                .lean();
    
            // Count total orders
            const totalOrders = await Registration.countDocuments({ _id: { $in: allIds } });
            const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages
    
            // Render the profile page
            res.render("user/myprofile", {
                title: "/ My Profile",
                user,
                userId,
                requirement,
                orders,
                totalOrders,
                totalPages,
                limit,
                currentPage: page,
                success_msg: req.flash("success_msg"),
                error_msg: req.flash("error_msg"),
            });
    
        } catch (error) {
            console.error("Error in myprofile:", error);
            if (!res.headersSent) res.redirect("/login"); // Prevent duplicate redirects
        }
    };
    
    
    


    //   user details

    userDetails=async(req,res)=>{

        const userId = req.user;

        if(userId == null  || userId == undefined ){
            res.redirect("/primum")
        }

        const requirement = await Registration.findById(req.params.id)
            .populate("userId", "name email randomId profilePicture role AboutMe")
            .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age gender active")
            .lean();


        res.render("user/userdetails",{
            title:" / User Details",
            user:req.user || null,
            userId,
            requirement,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
        })
    }


    forgetpassword=async(req,res)=>{
        const userId = null
        res.render("user/forgotpassword",{
            title:"/ Forget Password",    
            message: null,
            userId ,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
        })
    }
      

    termsandcondition= async(req,res)=>{
         const userId = req.user || null 

         res.render("user/termsandcondition",{
            title:"/ Terms & Condition",    
            message: null,
            userId ,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
        })

    }


    privacypolicy =async(req,res)=>{
        const userId =req.user || null  || undefined;

        res.render("user/privacyPolicy",{
            title:"/ privacypolicy",
            message : null,
            userId,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
        })
    }

    paymentsuccess= async(req,res) =>{

        const userId =req.user ;

        res.render("user/paymentsuccess",{
            title:"/ paymet successfully",
            message : null,
            userId,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
        })

    }


           


}

module.exports = new userPagesController();