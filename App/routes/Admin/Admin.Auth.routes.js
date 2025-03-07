const express = require("express");
const AdmianAuthController = require("../../controller/admin/Admin.auth.controller");
const router = express.Router();

router.post("/login", AdmianAuthController.login);
router.get("/logout", AdmianAuthController.logout);

module.exports = router;