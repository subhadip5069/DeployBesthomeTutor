const express = require("express");
const { unlockRequirement } = require("../../controller/user/unlock.user.controller");
const { authMiddleware } = require("../../utils/auth.middleware");

const router = express.Router();



router.post("/",authMiddleware, unlockRequirement);



module.exports = router;
