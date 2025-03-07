const express = require("express");
const filterrationController = require("../../controller/user/filterration.controller");
const router = express.Router();


// Route for searching registrations
router.get("/", filterrationController.searchRegistrations);

module.exports = router;
