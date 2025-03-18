const express = require("express");
const AdminPagesController = require("../../controller/admin/Admin.pages.controller");
const { AdminauthMiddleware } = require("../../utils/auth.middleware");
const RazorpayPayment = require("../../model/payment.model");
const router = express.Router();
const moment = require("moment");


router.get("/", AdminPagesController.Login);
router.get("/dashboard", AdminauthMiddleware,AdminPagesController.Dashboard);
router.get("/listOfStudents", AdminauthMiddleware,AdminPagesController.listofStudents);
router.get("/listOfTutor",AdminauthMiddleware, AdminPagesController.listOfTutor);
router.get("/documentVerification",AdminauthMiddleware, AdminPagesController.document);
router.get("/payments",AdminauthMiddleware, AdminPagesController.payments);
router.get("/createprimium",AdminauthMiddleware, AdminPagesController.createPrimium);
router.get("/getprimium", AdminauthMiddleware,AdminPagesController.getpurchaseplan);
router.get("/allstudentrequirment",AdminauthMiddleware, AdminPagesController.allstudentsrequirment);
router.get("/alltutorrequirment",AdminauthMiddleware, AdminPagesController.alltutorrequirment);
router.post("/adminupdatedtuition/:id",AdminauthMiddleware, AdminPagesController.adminupdatedtuition);
router.post("/upadteusercontactremaining/:id",AdminauthMiddleware, AdminPagesController.updateUserContactRemaining);



// Fetch hourly payments
router.get("/hourlyPaymentStats", async (req, res) => {
    try {
        const hourlyPayments = await RazorpayPayment.aggregate([
            { $match: { paymentStatus: "successful" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } }
        ]);

        const formattedData = hourlyPayments.map(p => ({
            time: `${p._id.hour}:00`,
            totalAmount: p.totalAmount / 100  // ✅ Convert paise to INR
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching hourly payment data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Fetch daily payments
router.get("/dailyPaymentStats", async (req, res) => {
    try {
        const dailyPayments = await RazorpayPayment.aggregate([
            { $match: { paymentStatus: "successful" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        const formattedData = dailyPayments.map(p => ({
            date: `${p._id.day}-${p._id.month}-${p._id.year}`,
            totalAmount: p.totalAmount / 100  // ✅ Convert paise to INR
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching daily payment data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Fetch monthly payments
router.get("/monthlyPaymentStats", async (req, res) => {
    try {
        const monthlyPayments = await RazorpayPayment.aggregate([
            { $match: { paymentStatus: "successful" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formattedData = monthlyPayments.map(p => ({
            month: `${p._id.month}-${p._id.year}`,
            totalAmount: p.totalAmount / 100  // ✅ Convert paise to INR
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching monthly payment data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Fetch yearly payments
router.get("/yearlyPaymentStats", async (req, res) => {
    try {
        const yearlyPayments = await RazorpayPayment.aggregate([
            { $match: { paymentStatus: "successful" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1 } }
        ]);

        const formattedData = yearlyPayments.map(p => ({
            year: `${p._id.year}`,
            totalAmount: p.totalAmount / 100  // ✅ Convert paise to INR
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error fetching yearly payment data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});






module.exports = router;