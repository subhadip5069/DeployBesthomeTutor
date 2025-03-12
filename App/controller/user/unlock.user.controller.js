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

    const user = await User.findById({_id:req.user.userId});
    console.log("User ID:", req.user.userId);
    console.log("User:", user);

   

    if (user.unlockedContactsRemaining <= 0) {
      return res.redirect("/primum"); // ✅ RETURN here
    }

    const requirement = await Registration.findById(requirementId)
      .populate("userId", "name email phone randomId role AboutMe")
      .select("userId tuitionLocation preferredTime preferredTutor feeType feeAmount state city pincode locality subject class sorted attachedFiles board qualification experience age gender active")
      .lean();

   

    const unlockCost = user.unlockedContacts > 0 ? user.balance / user.unlockedContacts : 0;

    if (user.balance < unlockCost) {
      res.redirect("/primum");
    }

    user.unlockedContactsRemaining -= 1;
    user.currentbalance = user.unlockedContactsRemaining > 0 
      ? user.balance / user.unlockedContactsRemaining 
      : 0;

    if (user.role === "tutor") {
      if (!user.unlockedStudents.includes(requirementId)) {
        user.unlockedStudents.push(requirementId);
      }
    } else if (user.role === "student") {
      if (!user.unlockedTutors.includes(requirementId)) {
        user.unlockedTutors.push(requirementId);
      }
    } else {
      return res.redirect("/"); // ✅ RETURN here
    }

    await user.save();

    // ✅ Ensure only ONE response is sent
    return res.render("user/unlockdetails", {
      title: "/ Unlock Details",
      requirement,
      userId: req.user,
    });

  } catch (error) {
    console.error("Error unlocking requirement:", error);
   
  }
};


}

module.exports = new UnlockController();
