const express = require("express");
const router = express.Router();

const marqueeController = require("../../controller/admin/marquee.controller");
const { AdminauthMiddleware } = require("../../utils/auth.middleware");

router.post("/update",AdminauthMiddleware, marqueeController.updateOneMarquee);
router.post("/getmarquee",AdminauthMiddleware, marqueeController.createMarquee);

module.exports = router;