const express = require('express');
const router = express.Router();

const userPagesController = require('../../controller/user/user.pages.constroller');
const { authMiddleware } = require('../../utils/auth.middleware');

// sighnup
router.get('/register', userPagesController.register);
// login
router.get('/login', userPagesController.login);

// pages
router.get('/', authMiddleware,userPagesController.index);
router.get('/registration', authMiddleware,userPagesController.registration);
router.get('/listingofstudent', authMiddleware,userPagesController.listingofstudent);
router.get('/listingoftutor', authMiddleware,userPagesController.listingoftutor);
router.get('/listing', authMiddleware,userPagesController.listing);
router.get('/filter', authMiddleware,userPagesController.filterList);
router.get('/primum', authMiddleware,userPagesController.primum);
router.get('/myprofile', authMiddleware,userPagesController.myprofile);
router.get('/userDetails/:id', authMiddleware,userPagesController.userDetails);
router.get('/changepassword',userPagesController.forgetpassword);
router.get("/terms&condition",authMiddleware,userPagesController.termsandcondition)
router.get("/privacypolicy",authMiddleware,userPagesController.privacypolicy)
router.get("/payment-success",authMiddleware,userPagesController.paymentsuccess)
router.get("/updatereg/:id",authMiddleware,userPagesController.editregistration)



module.exports = router;