const Registration = require("../../model/registration");
const User = require("../../model/user.model");

class FilterationController {
    searchRegistrations = async (req, res) => {
        try {
            let userId = req.user || null;
            let {
                category,
                classFilter, subjectFilter, preferredTutor, state, city, pincode,
                priceRange, searchQuery, page = 1
            } = req.query;

            let roleToFetch = category || null;

            page = parseInt(page) || 1;
            let limit = 9;
            let skip = (page - 1) * limit;

            // ✅ Build User Filter
            let userFilter = roleToFetch ? { role: roleToFetch } : {};

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

            // ✅ Fetch Registrations with Filters
            let registrations = await Registration.find(registrationFilter)
                .populate({ path: "userId", match: userFilter, select: "name email role randomId" })
                .lean();

            // ✅ Ensure Filtering by Role & State AFTER Fetching
            registrations = registrations.filter(reg =>
                reg.userId &&
                reg.userId.role === roleToFetch &&
                (!state || new RegExp(state.trim(), "i").test(reg.userId.state))
            );

            console.log(`Filtered Registrations (After Role & State): ${registrations.length}`);

            // ✅ Count Total Matching Registrations (AFTER Filtering)
            let totalUsers = registrations.length;
            let totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 1;

            // ✅ Ensure Page Number is in Range
            if (page > totalPages) {
                page = totalPages;
            }
            let paginatedRegistrations = registrations.slice(skip, skip + limit);
            const queryString = req.originalUrl.split('?')[1] || "";
            res.render("user/listing", { title: "Listing",
                requirements: paginatedRegistrations,
                userId,
                currentPage: page,
                roleToFetch,
                queryParams: req.query,
                filters: {
                    category,
                    classFilter, subjectFilter, preferredTutor, state, city, pincode,
                    priceRange, searchQuery, page
                },
                totalPages,
                currentPage: page, 
                totalPages,
                 queryString });


            // ✅ Paginate Results AFTER Filtering
            

            console.log(`Final Pagination: Showing Page ${page}/${totalPages}, Results: ${paginatedRegistrations.length}`);

            res.render("user/listing", {
                title: "Listing",
                requirements: paginatedRegistrations,
                userId,
                currentPage: page,
                queryParams: req.query,
                roleToFetch,
                filters: {
                    category,
                    classFilter, subjectFilter, preferredTutor, state, city, pincode,
                    priceRange, searchQuery, page
                },
                totalPages
            });

        } catch (error) {
            console.error("Error fetching registrations:", error);
            res.status(500).send("Server Error");
        }
    };
}

module.exports = new FilterationController();
