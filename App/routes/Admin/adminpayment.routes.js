const express = require("express");

const router = express.Router();

const AdminPaymentController = require("../../controller/admin/Admin.payment.controller");
const { AdminauthMiddleware } = require("../../utils/auth.middleware");

router.post("/createplan",AdminauthMiddleware, AdminPaymentController.createPlan);
router.post("/updatePlanStatus/:planId",AdminauthMiddleware, AdminPaymentController.updatePlanStatus);
router.post("/deletePlan/:id",AdminauthMiddleware, AdminPaymentController.deletePlan);

module.exports = router;