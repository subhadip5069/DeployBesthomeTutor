const express = require("express");
const filterrationController = require("../../controller/user/filterration.controller");
const { authMiddleware } = require("../../utils/auth.middleware");
const router = express.Router();


// Route for searching registrations
router.get("/", authMiddleware,filterrationController.searchRegistrations);

module.exports = router;
