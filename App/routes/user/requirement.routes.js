const express = require("express");

const router = express.Router();


const { authMiddleware } = require("../../utils/auth.middleware");
const requiremntController = require("../../controller/user/requirment.controller");

const {upload, compressImage, } = require('../../multer/tutor.multer');
const { route } = require("./user.pages.routes");
const { profileuploade,compressImage2 } = require("../../multer/profileimage");


router.post("/registration", authMiddleware, requiremntController.createTuitionRequirement);
router.post(
    "/tutor/registration",
    authMiddleware,
    upload.array("attachedFiles", 2), // Max 2 files
    compressImage,
    requiremntController.createRegistration
  );
  
router.post("/updatereg/:id", authMiddleware, profileuploade,compressImage2,requiremntController.updateRegistration);
router.post("/updaterequirment/:id", authMiddleware, requiremntController.updateTuitionRequirement);
router.post("/updatedtuition/:id", authMiddleware, requiremntController.updatedtuition);




module.exports = router;