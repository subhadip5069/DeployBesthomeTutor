const express = require("express");

const router = express.Router();

const AdminPaymentController = require("../../controller/admin/Admin.payment.controller");

router.post("/createplan", AdminPaymentController.createPlan);
router.post("/updatePlanStatus/:planId", AdminPaymentController.updatePlanStatus);
router.post("/deletePlan/:id", AdminPaymentController.deletePlan);

module.exports = router;