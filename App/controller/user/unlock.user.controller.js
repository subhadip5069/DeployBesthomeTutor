const Registration = require("../../model/registration");
const User = require("../../model/user.model");
class UnlockController {
  

  unlockRequirement = async (req, res) => {
    try {
      const { requirementId } = req.body;
      console.log("Received request:", { requirementId }, req.body);
  
      if (!requirementId) {
        return res.redirect("/"); // ✅ RETURN here
      }
  
      const user = await User.findById(req.user.userId);
      console.log("User ID:", req.user.userId);
      console.log("User:", user);
  
      if (!user) {
        return res.redirect("/"); // ✅ Ensure user exists
      }
  
      if (user.unlockedContactsRemaining <= 0) {
        return res.redirect("/primum"); // ✅ RETURN if no credits left
      }
  
      const requirement = await Registration.findById(requirementId)
        .populate("userId", "name email phone randomId role AboutMe")
        .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age gender active")
        .lean();
  
      if (!requirement) {
        return res.redirect("/"); // ✅ RETURN if requirement not found
      }
  
      // Check if already unlocked
      const isAlreadyUnlocked = user.role === "tutor" 
        ? user.unlockedStudents.includes(requirementId) 
        : user.unlockedTutors.includes(requirementId);
  
      if (!isAlreadyUnlocked) {
        // Deduct balance only if not unlocked before
        const unlockCost = user.unlockedContacts > 0 ? user.balance / user.unlockedContacts : 0;
  
        if (user.balance < unlockCost) {
          return res.redirect("/primum");
        }
  
        user.unlockedContactsRemaining -= 1;
        user.currentbalance = user.unlockedContactsRemaining > 0 
          ? user.balance / user.unlockedContactsRemaining 
          : 0;
  
        // Add requirement ID to unlocked list
        if (user.role === "tutor") {
          user.unlockedStudents.push(requirementId);
        } else if (user.role === "student") {
          user.unlockedTutors.push(requirementId);
        } else {
          return res.redirect("/");
        }
  
        await user.save();
      }
  
      // ✅ Ensure only ONE response is sent
      return res.render("user/unlockdetails", {
        title: "/ Unlock Details",
        requirement,
        userId: req.user,
      });
  
    } catch (error) {
      console.error("Error unlocking requirement:", error);
      return res.redirect("/error"); // ✅ Redirect to error page if an issue occurs
    }
  };
  

 


}

module.exports = new UnlockController();
