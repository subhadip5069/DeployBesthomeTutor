const PurchasePlan = require("../../model/purchaceplane");

class PaymentController {
    payment = async (req, res) => {
        try {
          const userId = req.user ;

          
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
            user: userId.id,
            userId,
            plan: plan
          });
        } catch (error) {
          console.error("Error fetching plan:", error);
          res.status(500).render("user/error", { 
            title: "Error", 
            message: "Internal Server Error" 
          });
        }
      };
      
}

module.exports = new PaymentController();
