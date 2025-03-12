const express = require("express");
const UnlockController = require("../../controller/user/unlock.user.controller");
const { authMiddleware } = require("../../utils/auth.middleware");

const router = express.Router();



router.post("/",authMiddleware, UnlockController.unlockRequirement);



module.exports = router;
