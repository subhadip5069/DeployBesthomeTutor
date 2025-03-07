const { default: mongoose } = require("mongoose");
const PurchasePlan = require("../../model/purchaceplane");






class AdminPaymentController {
    
    createPlan = async (req, res) => {
        try {
            let { planName, price, validity, unlockUserCount, description, features, status,sgst,cgst,igst , role} = req.body;
            price = Number(price) || 0;
            sgst = Number(sgst) || 0;
            cgst = Number(cgst) || 0;
            igst = Number(igst) || 0;
            
    
            if (!features || !Array.isArray(features)) {
                features = [];
            } else {
                features = features.filter(feature => feature.name?.trim()); // Remove empty feature objects
            }
    
        

            // price fixed by admin and gst fixed bym admin
            // sgst cgst igst fixed by admin
            

            const sgstAmount = (price * sgst) / 100;
            const cgstAmount = (price * cgst) / 100;
            const igstAmount = (price * igst) / 100;
    
            // Final Price Calculation
            const finalPrice = price + sgstAmount + cgstAmount + igstAmount;
            
       
    
            const newPlan = new PurchasePlan({
                planName,
                price,
                validity,
                unlockUserCount,
                description,
                features,
                status,
                sgst,
                cgst,
                igst,
                finalPrice,
                role
            });
    
            await newPlan.save();
            res.redirect("/admin/getprimium");
        } catch (error) {
            console.error("Error creating plan:", error);
            res.redirect("/admin/getprimium");
           
        }
    };
    updatePlanStatus = async (req, res) => {
        try {
            const planId = req.params.planId || req.body.planId;  // Check both params and body
            if (!planId) {
                console.error("Plan ID is missing!");
                return res.status(400).send("Plan ID is required.");
            }
    
            console.log("Received Plan ID:", planId);
    
            if (!mongoose.Types.ObjectId.isValid(planId)) {
                console.error("Invalid Plan ID format:", planId);
                return res.status(400).send("Invalid Plan ID.");
            }
    
            // Find plan before updating
            const plan = await PurchasePlan.findById(planId);
            if (!plan) {
                console.error("Plan not found:", planId);
                return res.status(404).send("Plan not found.");
            }
    
            // Toggle status
            plan.status = plan.status === "active" ? "inactive" : "active";
            await plan.save();
    
            console.log("Updated Plan Status:", plan.status);
            res.redirect("/admin/getprimium");
    
        } catch (error) {
            console.error("Error updating plan status:", error);
            res.redirect("/admin/getprimium");
        }
    };
    
    
    
    deletePlan = async (req, res) => {
        try {
            const planId = req.params.id;
            await PurchasePlan.findByIdAndDelete(planId);
            res.redirect("/admin/getprimium");
        } catch (error) {
            res.redirect("/admin/getprimium");
        }
    };
    
    }

    module.exports = new AdminPaymentController();