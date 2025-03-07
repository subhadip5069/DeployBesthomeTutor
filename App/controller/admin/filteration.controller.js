const Registration = require('../../model/registration');
const userModel = require('../../model/user.model');

 

class FilterationController {
// all tutor
searchRegistrations = async (req, res) => {
    try {
        let query = req.query.query;
        if (!query) return res.json([]);

        let regex = new RegExp(query, "i"); // Case-insensitive search

        let registrations = await Registration.find({
            $or: [
                { "userId.name": regex },
                { "userId.email": regex },
                { "userId.phone": regex },
                { "userId.randomId": regex },
                { "class": regex },
                { "subject": regex }
            ]
        }).populate("userId");

        res.json(registrations);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

}

module.exports = new FilterationController();