const PurchasePlan = require("../../model/purchaceplane");

class PaymentController {
    payment = async (req, res) => {
        try {
          const userId = req.user?.userId ;

          
          // Retrieve the specific plan by ID from req.params.id
          const plan = await PurchasePlan.findById(req.params.id);
      
          if (!plan) {
            return res.status(404).render("user/payment", {
              title: "Payment",
              user: req.user,
              plan: null,
              message: "Plan not found."
            });
          }
      
          res.render("user/payment", {
            title: "Payment",
            user: req.user?.userId,
            userId,
            plan: plan
          });
        } catch (error) {
          console.error("Error fetching plan:", error);
          res.redirect("/");
      };
    }
}

module.exports = new PaymentController();
