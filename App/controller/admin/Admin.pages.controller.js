const PurchasePlan = require('../../model/purchaceplane');
const Registration = require('../../model/registration');
const userModel = require('../../model/user.model');

class AdminPagesController {

    Login=async(req,res)=>{
    
            res.render('Admin/login')
       
    }

    Dashboard=async(req,res)=>{
        const users = await userModel.find();
       
        res.render('Admin/dashboard' ,{users})
       
    }
    listofStudents=async(req,res)=>{
        const users = await userModel.find({role:'student'});
       
        res.render('Admin/listOfStudents' ,{users})
       
    }
    listOfTutor=async(req,res)=>{
        const users = await userModel.find({role:'tutor'});
       
        res.render('Admin/listOfTutor' ,{users})
       
    }

    document = async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 10;
            if (page < 1) page = 1; // Ensures page number is valid
    
            let skip = (page - 1) * limit;
    
            // Count total inactive registrations with attached files
            const totalRegistrations = await Registration.countDocuments({
                status: "inactive",
                attachedFiles: { $exists: true, $not: { $size: 0 } }
            });
    
            const totalPages = Math.ceil(totalRegistrations / limit);
    
            // Prevents querying if page is out of range
            if (page > totalPages && totalPages !== 0) {
                return res.redirect(`?page=${totalPages}`);
            }
    
            const registrations = await Registration.find(
                { status: "inactive", attachedFiles: { $exists: true, $not: { $size: 0 } } }
            )
                .populate("userId", "name email randomId") // Populates user details
                .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age createdAt updatedAt")
                .skip(skip)
                .limit(limit)
                .lean(); // Improves performance
    
            // Render view with pagination data
            res.render("Admin/documentVerification", {
                title: "Inactive Registrations with Documents",
                registrations,
                currentPage: page,
                totalPages
            });
    
        } catch (err) {
            console.error("Error fetching registrations:", err);
            res.status(500).send("Internal Server Error");
        }
    };

    
    allstudentsrequirment = async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 6;
            if (page < 1) page = 1;
    
            let skip = (page - 1) * limit;
            let searchQuery = req.query.query ? req.query.query.trim() : "";
    
            // Base filter: Fetch students WITHOUT documents
            let filter = {
                status: "active",
                attachedFiles: { $exists: true, $size: 0 }
            };
    
            // If there's a search query, modify the filter
            if (searchQuery) {
                filter.$or = [
                    { "userId.name": { $regex: searchQuery, $options: "i" } }, // Case-insensitive name
                    { "userId.email": { $regex: searchQuery, $options: "i" } }, // Email
                    { "userId.phone": { $regex: searchQuery, $options: "i" } }, // Phone number
                    { "userId.randomId": { $regex: searchQuery, $options: "i" } }, // Random ID
                    { tuitionLocation: { $regex: searchQuery, $options: "i" } }, // Tuition Location
                    { preferredTime: { $regex: searchQuery, $options: "i" } }, // Preferred Time
                    { preferredTutor: { $regex: searchQuery, $options: "i" } }, // Preferred Tutor
                    { subject: { $regex: searchQuery, $options: "i" } }, // Subject
                    { class: { $regex: searchQuery, $options: "i" } }, // Class
                    { board: { $regex: searchQuery, $options: "i" } } // Board
                ];
            }
    
            // Count total matching results
            const totalRegistrations = await Registration.countDocuments(filter);
            const totalPages = Math.ceil(totalRegistrations / limit);
    
            if (page > totalPages && totalPages !== 0) {
                return res.redirect(`?page=${totalPages}`);
            }
    
            // Fetch student registrations based on the filter
            const registrations = await Registration.find(filter)
                .populate({
                    path: "userId",
                    match: { role: "student" }, // Ensure only students are fetched
                    select: "name email randomId role phone"
                })
                .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted board qualification experience age createdAt updatedAt")
                .skip(skip)
                .limit(limit)
                .lean();
    
            // Remove registrations where userId is missing
            const filteredRegistrations = registrations.filter(reg => reg.userId);
    
            // Fetch all students (for debugging)
            const students = await Registration.find().populate("userId");
    
            res.render("Admin/allstudentrequirment", {
                title: "Student Registrations Without Documents",
                registrations: filteredRegistrations,
                students: students,
                currentPage: page,
                totalPages
            });
    
        } catch (err) {
            console.error("Error fetching student registrations:", err);
            res.status(500).send("Internal Server Error");
        }
    };
    
    
    
            
           
            
    alltutorrequirment = async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 10;
            if (page < 1) page = 1; // Ensures valid page number
            let searchQuery = req.query.query ? req.query.query.trim() : "";
    
            let skip = (page - 1) * limit;
    
            // Base filter for active registrations with attached files
            let filter = {
                status: "active",
                attachedFiles: { $exists: true, $not: { $size: 0 } }
            };
    
            // Count total active registrations
            const totalRegistrations = await Registration.countDocuments(filter);
            const totalPages = Math.ceil(totalRegistrations / limit);
    
            // Redirect to last valid page if page exceeds range
            if (page > totalPages && totalPages !== 0) {
                return res.redirect(`?page=${totalPages}`);
            }
    
            console.log("Search Query:", searchQuery);
    
            // Fetch registrations with populated user details
            let registrations = await Registration.find(filter)
                .populate({
                    path: "userId",
                    match: { role: "tutor" }, // Ensures only tutors are fetched
                    select: "name email randomId role phone"
                })
                .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age createdAt updatedAt")
                .skip(skip)
                .limit(limit)
                .lean(); // Improves performance
    
            // Remove null values (users who are not tutors)
            let filteredRegistrations = registrations.filter(reg => reg.userId);
    
            // Apply search filtering **after** population
            if (searchQuery) {
                filteredRegistrations = filteredRegistrations.filter(reg =>
                    String(reg.userId?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.userId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.userId?.phone || "").includes(searchQuery) || // ✅ Fix: Convert phone to string
                    String(reg.userId?.randomId || "").includes(searchQuery) ||
                    String(reg.tuitionLocation || "").toLowerCase().includes(searchQuery.toLowerCase()) || // ✅ Fix
                    String(reg.preferredTime || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.preferredTutor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.class || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    String(reg.board || "").toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
    
            res.render("Admin/alltutorrequirment", {
                title: "Tutor Registrations with Documents",
                registrations: filteredRegistrations,
                currentPage: page,
                totalPages
            });
    
        } catch (err) {
            console.error("Error fetching tutor registrations:", err);
            res.status(500).send("Internal Server Error");
        }
    };
    
  
    
    

    
    

    payments=async(req,res)=>{
        res.render('Admin/payments')
    }

    createPrimium=async(req,res)=>{
        res.render('Admin/createpurchaseplane',{
            title:'Create Purchase Plan'
        })
    }
    getpurchaseplan = async (req, res) => {
        try {
            const plans = await PurchasePlan.find().lean();

          
            res.render("Admin/getpurchaceplane", {
                title: "Purchase Plan",
                plans,
               // Ensure CSRF middleware is enabled
            });
        } catch (error) {
            console.error("Error fetching purchase plans:", error);
            
        }
    };
    
    taxchat=async(req,res)=>{
        res.render('Admin/taxchat')
    }
}

module.exports = new AdminPagesController();
