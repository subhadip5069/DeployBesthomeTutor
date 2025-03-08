const Registration = require("../../model/registration");
const User = require("../../model/user.model");

const unlockRequirement = async (req, res) => {
  try {
    const { requirementId } = req.body;
    console.log("Received request:", { requirementId }, req.body);

    if (!requirementId) {
      return res.status(400).json({ error: "Missing requirement ID" });
    }

    const user = await User.findById(req.user.id);
    console.log("User:", user);

    if (!user) {
      return res.status(401).json({ error: "User not found. Please log in." });
    }

    // Redirect to premium if no unlocks are left
    if (user.unlockedContactsRemaining <= 0) {
      return res.redirect("/primum");
    }

    const requirement = await Registration.findById(requirementId)
      .populate("userId", "name email phone randomId role AboutMe")
      .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age gender active")
      .lean();

    if (!requirement || !requirement.userId) {
      return res.status(404).json({ error: "Requirement or user not found." });
    }

    // Calculate cost per unlock without changing balance
    const unlockCost = user.unlockedContacts > 0 ? user.balance / user.unlockedContacts : 0;

    if (user.balance < unlockCost) {
      return res.status(403).json({ error: "Insufficient balance. Please recharge." });
    }

    // Decrement remaining unlocks
    user.unlockedContactsRemaining -= 1;

    // Update current balance only (without modifying balance)
    user.currentbalance = user.unlockedContactsRemaining > 0 
      ? user.balance / user.unlockedContactsRemaining 
      : 0; // Avoid division by zero

    // Push the requirement ID into the correct array based on the user role
    if (user.role === "tutor") {
      if (!user.unlockedStudents.includes(requirementId)) {
        user.unlockedStudents.push(requirementId);
      }
    } else if (user.role === "student") {
      if (!user.unlockedTutors.includes(requirementId)) {
        user.unlockedTutors.push(requirementId);
      }
    } else {
      return res.status(400).json({ error: "Invalid user role." });
    }

    // Save the updated user object
    await user.save();

    // Render the unlock details page
    res.render("user/unlockdetails", {
      title: "/ Unlock Details",
      requirement,
      userId: req.user,
    });

  } catch (error) {
    console.error("Error unlocking requirement:", error);
    res.status(500).json({ error: "Something went wrong. Try again later." });
  }
};




module.exports = { unlockRequirement };
