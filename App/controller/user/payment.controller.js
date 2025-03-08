const Razorpay = require("razorpay");
const crypto = require("crypto");
const RazorpayPayment = require("../../model/payment.model");
const PurchasePlan = require("../../model/purchaceplane");
const User = require("../../model/user.model");

// Initialize Razorpay



class paymentcontroller{

// Create Order
createOrder = async (req, res) => {
  try {
    console.log("req.body:", req.body);

    const { userId, planId, amount } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is missing" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    // Fetch user and plan details from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = await PurchasePlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Initialize Razorpay instance
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await instance.orders.create(options);

    // Save order details in the database
    const payment = new RazorpayPayment({
      userId,
      planId,
      amount: amount * 100,
      currency: "INR",
      razorpayOrderId: order.id,
      razorpayPaymentId: `pending_${Date.now()}`, // ✅ Temporary unique ID
      paymentStatus: "pending",
    });
    
    
    await payment.save();

    // 🔹 Update User's Balance and Unlocks  
    user.balance = (user.balance || 0) + plan.price;

    if (user.unlockedContactsRemaining > 0) {
      // If there are remaining unlocks, add the new plan's unlock count to the remaining count
      user.unlockedContactsRemaining += plan.unlockUserCount;
    } else {
      // Otherwise, set it to the new plan's unlock count
      user.unlockedContactsRemaining = plan.unlockUserCount;
    }

    user.unlockedContacts += plan.unlockUserCount; // Keep track of total unlocks
    await user.save();

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      newBalance: user.balance,  
      unlockedContactsRemaining: user.unlockedContactsRemaining, // Send updated remaining unlocks
    });

  } catch (error) {
    console.error("Error in createOrder:", error);
    res.redirect('/myprofile');
  }
};






// Verify Payment
verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Retrieve order from DB
    const payment = await RazorpayPayment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ error: "Order not found" });

    // Verify Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      payment.paymentStatus = "failed";
      await payment.save();
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Update payment status
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentStatus = "successful";
    await payment.save();

    res.json({ success: true, message: "Payment successful" });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
}
module.exports = new paymentcontroller();
