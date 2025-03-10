const express = require('express');

const router = express.Router();

const UserAuthController = require('../../controller/user/authycontroller');
const { route } = require('./user.pages.routes');
const { profileuploade, compressImage2 } = require('../../multer/profileimage');


router.post('/signup',profileuploade,compressImage2, UserAuthController.signup);
router.post('/login', UserAuthController.login);
router.post('/verify', UserAuthController.verifyOTP);
router.post('/forgot-password', UserAuthController.forgotPassword);
router.post('/resetpassword', UserAuthController.resetPassword);
router.post('/resendotp', UserAuthController.resendOtp);
router.post('/send-otp', UserAuthController.resendOtp2);
router.post('/verify-otp', UserAuthController.verifyOtp);
router.get("/logout",UserAuthController.logout)


module.exports = router;