const Registration = require("../../model/registration");
const User = require("../../model/user.model");

class FilterationController {
    searchRegistrations = async (req, res) => {
        try {
            let userId = req.user;
            let {
                category, classFilter, subjectFilter, preferredTutor,
                state, city, pincode, priceRange, searchQuery, page = 1
            } = req.query;
    
            let roleToFetch = category || null;
            page = Number.isInteger(parseInt(page)) ? parseInt(page) : 1;
            let limit = 30;
            let skip = (page - 1) * limit;
    
            // ✅ Build User Filter
            let userFilter = roleToFetch ? { role: roleToFetch } : {};
            if (state) {
                userFilter.state = { $regex: new RegExp(state.trim(), "i") };
            }
    
            // ✅ Build Registration Filter
            let registrationFilter = { status: { $in: ["active", "Active"] } };
    
            if (classFilter) {
                registrationFilter.class = { $in: classFilter.split(",").map(c => c.trim()).filter(Boolean) };
            }
    
            if (subjectFilter) {
                const subjectsArray = Array.isArray(subjectFilter)
                    ? subjectFilter.map(s => s.trim()).filter(Boolean)
                    : subjectFilter.split(",").map(s => s.trim()).filter(Boolean);
    
                if (subjectsArray.length > 0) {
                    registrationFilter.$or = subjectsArray.map(subject => ({
                        subject: { $regex: subject, $options: "i" }
                    }));
                }
            }
    
            if (preferredTutor) {
                registrationFilter.preferredTutor = { $regex: new RegExp(preferredTutor.trim(), "i") };
            }
            if (city) {
                registrationFilter.city = { $regex: new RegExp(city.trim(), "i") };
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
                const searchConditions = [
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
                    searchConditions.push(
                        { pincode: Number(searchQuery) },
                        { experience: Number(searchQuery) },
                        { age: Number(searchQuery) }
                    );
                }
    
                // Merge with existing filters
                registrationFilter.$or = registrationFilter.$or ? registrationFilter.$or.concat(searchConditions) : searchConditions;
            }
    
            console.log("Final Query Filter:", JSON.stringify(registrationFilter, null, 2));
    
            // ✅ Count Total Users for Pagination
            let totalUsers = await Registration.countDocuments(registrationFilter);
            let totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 1;
            if (page > totalPages) page = totalPages;
    
            // ✅ Fetch Registrations
            let registrations = await Registration.find(registrationFilter)
                .populate({ path: "userId", match: userFilter, select: "name email role state randomId" })
                .skip(skip)
                .limit(limit)
                .lean();
    
            // ✅ Filter Registrations After Fetching
            registrations = registrations.filter(reg => reg.userId && reg.userId.role === roleToFetch);
    
            console.log(`Filtered Registrations: ${registrations.length}`);
    
            const queryString = req.originalUrl.split('?')[1] || "";
    
            // ✅ Render EJS Page
            res.render("user/listing", {
                title: "Listing",
                requirements: registrations,
                userId,
                currentPage: page,
                totalPages,
                roleToFetch,
                queryParams: req.query,
                filters: {
                    category, classFilter, subjectFilter, preferredTutor,
                    state, city, pincode, priceRange, searchQuery, page
                },
                queryString
            });
    
            console.log(`Page ${page}/${totalPages}, Results: ${registrations.length}`);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            res.status(500).render("user/error", { title: "Error", message: "Internal Server Error" });
        }
    };
    
}

module.exports = new FilterationController();
