const User = require("../../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


class AdminAuthController {


login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.session.message = { type: 'error', text: 'Email and password are required.' };
            return res.redirect('/admin/');
        }

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            req.session.message = { type: 'error', text: 'Invalid credentials or unauthorized access.' };
            return res.redirect('/admin/');
        }

        // Check if password matches
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            req.session.message = { type: 'error', text: 'Invalid credentials.' };
            return res.redirect('/admin/');
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        if (!token) {
            req.session.message = { type: 'error', text: 'Failed to generate authentication token.' };
            return res.redirect('/admin/');
        }

        // Store token in a cookie
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1-hour expiry
        console.log(token);

        req.session.message = { type: 'success', text: 'Login successful!' };
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Login Error:", error);
        req.session.message = { type: 'error', text: 'Something went wrong. Please try again.' };
        return res.redirect('/admin/');
    }
};

logout = async (req, res) => {
    res.clearCookie("token"); // Remove authentication cookie
    console.log("Logout successful!");

    // Store a success message in session (if needed)
    req.session.message = { type: "success", text: "Logout successful!" }; 
    
    // Correctly redirect to the admin login page
    res.redirect("/admin/");
};
}

module.exports = new AdminAuthController();