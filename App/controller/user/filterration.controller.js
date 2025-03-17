const Registration = require("../../model/registration");
const User = require("../../model/user.model");

class FilterationController {
    searchRegistrations = async (req, res) => {
        try {
            let userId = req.user ;
            let {
                category, classFilter, subjectFilter, preferredTutor,
                state, city, pincode, priceRange, searchQuery, page = 1
            } = req.query;

            let roleToFetch = category || null;
            page = parseInt(page) || 1;
            let limit = 9;
            let skip = (page - 1) * limit;

            // ✅ Build User Filter (for role & state)
            let userFilter = roleToFetch ? { role: roleToFetch } : {};
            if (state) {
                userFilter.state = { $regex: new RegExp(state.trim(), "i") };
            }

            // ✅ Build Registration Filter
            let registrationFilter = { status: "active" };

            if (classFilter) {
                registrationFilter.class = { $in: classFilter.split(",").map(c => c.trim()) };
            }
            if (subjectFilter) {
                registrationFilter.subject = { $in: subjectFilter.split(",").map(s => s.trim()) };
            }
            if (preferredTutor) {
                registrationFilter.preferredTutor = preferredTutor.trim();
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

            console.log("Final Query Filter:", JSON.stringify(registrationFilter, null, 2));

            // ✅ Fetch Registrations
            let registrations = await Registration.find(registrationFilter)
                .populate({ path: "userId", match: userFilter, select: "name email role state randomId" })
                .lean();

            // ✅ Filter Registrations After Fetching
            registrations = registrations.filter(reg => reg.userId && reg.userId.role === roleToFetch);

            console.log(`Filtered Registrations: ${registrations.length}`);

            // ✅ Pagination Logic
            let totalUsers = registrations.length;
            let totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 1;
            if (page > totalPages) page = totalPages;
            let paginatedRegistrations = registrations.slice(skip, skip + limit);
            const queryString = req.originalUrl.split('?')[1] || "";

            // ✅ Render EJS Page
            res.render("user/listing", {
                title: "Listing",
                requirements: paginatedRegistrations,
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

            console.log(`Page ${page}/${totalPages}, Results: ${paginatedRegistrations.length}`);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            res.status(500).render("user/error", { title: "Error", message: "Internal Server Error" });
        }
    };
}

module.exports = new FilterationController();
