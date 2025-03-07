const express = require("express");
const router = express.Router();

const Registration = require("../../model/registration");
const { AdminauthMiddleware } = require("../../utils/auth.middleware");

router.get("/search",AdminauthMiddleware ,  async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.json([]);

        const students = await Registration.find({})
            .populate({
                path: "userId",
                select: "name email phone" // Ensures only these fields are populated
            })
            .exec();

        console.log("Students with populated userId:", students); // Debugging log

        const filteredStudents = students.filter(student => {
            return (
                student.userId &&
                (
                    student.userId.name?.toLowerCase().includes(query.toLowerCase()) ||
                    student.userId.email?.toLowerCase().includes(query.toLowerCase()) ||
                    String(student.userId.phone || "").includes(query) // Convert phone to string
                )
            );
        });
        

        console.log("Filtered Students:", filteredStudents); // Debugging log

        res.json(filteredStudents);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get("/filteration/search",AdminauthMiddleware, async (req, res) => {
    try {
        const query = req.query.query.trim().toLowerCase();

        const students = await Registration.find().populate("userId");

        console.log("All Students Data Before Filtering:", students); // Debugging Log

        const filteredStudents = students.filter(student => {
            return (
                student.userId &&
                (
                    student.userId.name?.toLowerCase().includes(query) ||
                    student.userId.email?.toLowerCase().includes(query) ||
                    String(student.userId.phone || "").includes(query)
                )
                
            );
        });

        console.log("Filtered Students:", filteredStudents); // Debugging Log

        res.json(filteredStudents);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/filteration/search",AdminauthMiddleware, async (req, res) => {
    try {
        const query = req.query.query.trim().toLowerCase();

        const students = await Registration.find().populate("userId");

        console.log("All Students Before Filtering:", students); // Debugging Log

        const filteredStudents = students.filter(student => {
            console.log("Checking Student:", student.userId); // Debugging Log

            return (
                student.userId?.name?.toLowerCase().includes(query) ||
                student.userId?.email?.toLowerCase().includes(query) ||
                (student.userId?.phone ? student.userId.phone.toString().includes(query) : false) ||
                student.tuitionLocation.some(location => location.toLowerCase().includes(query)) ||
                student.preferredTime.some(time => time.toLowerCase().includes(query)) ||
                student.preferredTutor.toLowerCase().includes(query) ||
                student.feeType.toLowerCase().includes(query) ||
                student.feeAmount.toString().includes(query) ||
                student.state.toLowerCase().includes(query) ||
                student.city.toLowerCase().includes(query) ||
                student.pincode.toString().includes(query) ||
                student.locality.toLowerCase().includes(query) ||
                student.subject.toLowerCase().includes(query) ||
                student.class.toLowerCase().includes(query) ||
                student.sorted.toLowerCase().includes(query) ||
                student.board?.toLowerCase().includes(query) ||
                student.qualification?.toLowerCase().includes(query) ||
                (student.experience ? student.experience.toString().includes(query) : false) ||
                (student.age ? student.age.toString().includes(query) : false) ||
                student.status.toLowerCase().includes(query) ||
                student.attachedFiles.some(file => 
                    file.fileType.toLowerCase().includes(query) || 
                    file.filePath.toLowerCase().includes(query)
                )
            );
        });

        console.log("Filtered Students:", filteredStudents); // Debugging Log

        res.json(filteredStudents);
    } catch (error) {
        console.error("Error searching students:", error);
        res.redirect('/admin/dashboard');
    }
});




module.exports = router;
