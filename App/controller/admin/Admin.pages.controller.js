const RazorpayPayment = require('../../model/payment.model');
const PurchasePlan = require('../../model/purchaceplane');
const Registration = require('../../model/registration');
const User = require('../../model/user.model');
const userModel = require('../../model/user.model');

class AdminPagesController {

    Login=async(req,res)=>{
    
            res.render('Admin/login')
       
    }


  

    

    Dashboard = async (req, res) => {
        try {
            const userId = req.user;
    
            // Fetch total counts
            const [totalUsers, totalStudents, totalTeachers, totalRequirements] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: "student" }),
                User.countDocuments({ role: "tutor" }),
                Registration.countDocuments(), // Assuming "Registration" stores some requirement data
            ]);
    
            // Fetch total payments correctly
            const totalPayments = await RazorpayPayment.aggregate([
                { $match: { paymentStatus: "successful" } }, // Only count successful payments
                { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
            ]);
    
            // Ensure totalAmount is a number
            const totalAmount = totalPayments.length > 0 ? totalPayments[0].totalAmount : 0;
    
            res.render('Admin/dashboard', {
                userId,
                totalUsers,
                totalStudents,
                totalTeachers,
                totalRequirements,
                totalPayments: totalAmount/100,
            });
        } catch (error) {
            console.error("Error loading dashboard:", error);
            res.redirect('/admin/');
        }
    };
    
    
    // API Route for Payment Data (to be called via AJAX)
 getPaymentStats = async (req, res) => {
        try {
            const payments = await RazorpayPayment.aggregate([
                { $match: { paymentStatus: "successful" } }, // Only successful payments
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $lookup: {
                        from: "purchaseplans",
                        localField: "planId",
                        foreignField: "_id",
                        as: "plan",
                    },
                },
                { $unwind: "$user" },
                { $unwind: "$plan" },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 },
                        users: { $push: "$user.name" }, // List of users
                        plans: { $push: "$plan.name" }, // List of plans
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]);
    
            const formattedData = payments.map((p) => ({
                year: p._id.year,
                month: p._id.month,
                totalAmount: p.totalAmount / 100, // Convert paise to INR
                count: p.count,
                users: p.users,
                plans: p.plans,
            }));
    
            res.json({ success: true, data: formattedData });
        } catch (error) {
            console.error("Error fetching payment stats:", error);
            res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    };
    
    // Export Routes

    
    listofStudents=async(req,res)=>{
            const userId = req.user;
        const users = await userModel.find({role:'student'}).lean();
       
        res.render('Admin/listOfStudents' ,{users,userId})
       
    }
    listOfTutor=async(req,res)=>{
            const userId = req.user;
        const users = await userModel.find({role:'tutor'}).lean();
       
        res.render('Admin/listOfTutor' ,{users ,userId})
       
    }

    document = async (req, res) => {
        try {
            const userId = req.user;
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
                totalPages,
                userId
            });
    
        } catch (err) {
            console.error("Error fetching registrations:", err);
           res.redirect("/admin/documentverification");
        }
    };

    
    allstudentsrequirment = async (req, res) => {
        try {
            const userId = req.user;
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
                totalPages,
                userId
            });
    
        } catch (err) {
            console.error("Error fetching student registrations:", err);
            res.redirect("/admin/allstudentrequirment");
        }
    };
    
    
    
            
           
            
    alltutorrequirment = async (req, res) => {
        try {
            const userId = req.user;
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
                totalPages,
                userId
            });
    
        } catch (err) {
            console.error("Error fetching tutor registrations:", err);
            res.redirect("/admin/alltutorrequirment");
        }
    };
    
   

    payments=async(req,res)=>{
        const userId = req.user;
        const payments = await RazorpayPayment.find()
        .populate("userId", "name email")
        .populate("planId", "planName")
        .sort({ createdAt: -1 })  // Ensure planId is populated
        .lean();
        res.render('Admin/payments',{
            title:'Payments',
            userId,
            payments
        })
    }

    createPrimium=async(req,res)=>{
        const userId = req.user;
        res.render('Admin/createpurchaseplane',{
            title:'Create Purchase Plan',
            userId
        })
    }
    getpurchaseplan = async (req, res) => {
        try {
            const userId = req.user;
            const plans = await PurchasePlan.find().lean();

          
            res.render("Admin/getpurchaceplane", {
                title: "Purchase Plan",
                plans,
               // Ensure CSRF middleware is enabled
                userId
            });
        } catch (error) {
            console.error("Error fetching purchase plans:", error);
            
        }
    };
    
   
}

module.exports = new AdminPagesController();
