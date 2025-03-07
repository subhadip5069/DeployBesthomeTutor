const express = require('express');
const router = express.Router();


const paymentController = require('../../controller/user/payment.controller');

const razorpayController = require('../../controller/user/payment.control.razorpay');
const {authMiddleware} = require('../../utils/auth.middleware');


router.post('/process-payment', authMiddleware, paymentController.createOrder);
router.post('/verify-payment',authMiddleware, paymentController.verifyPayment);


router.get('/payment/:id', authMiddleware, razorpayController.payment);

module.exports = router;

