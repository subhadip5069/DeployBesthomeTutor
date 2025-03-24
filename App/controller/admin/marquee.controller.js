const Marquee = require("../../model/marquee");

class MarqueeController {
    createMarquee = async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.redirect("/admin/marquee?error=Message is required");
            }

            const newMarquee = new Marquee({ message });
            await newMarquee.save();

            console.log("Created Marquee:", newMarquee);

            res.redirect("/admin/marquee");
        } catch (error) {
            console.error("Error creating marquee:", error);
            res.redirect("/admin/marquee?error=Error creating marquee");
        }
    }
    updateOneMarquee = async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.redirect("/admin/marquee?error=Message is required");
            }

            // Update marquee only if it exists (DO NOT create a new one)
            const updatedMarquee = await Marquee.findOneAndUpdate(
                {}, // Find the first marquee
                { $set: { message } }, 
                { new: true } // Return the updated document
            );

            // If no marquee was found, return an error
            if (!updatedMarquee) {
                return res.redirect("/admin/marquee?error=No marquee found to update");
            }

            console.log("Updated Marquee:", updatedMarquee);
            res.redirect("/admin/marquee"); // Refresh the page with updated data
        } catch (error) {
            console.error("Error updating marquee:", error);
            res.redirect("/admin/marquee?error=Error updating marquee");
        }
    };
}

module.exports = new MarqueeController();
