const User = require("../../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


class AdminAuthController {
   login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.redirect('/admin/'); // ✅ Stops execution
        }

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            return res.redirect('/admin/'); // ✅ Stops execution
        }

        // Check if password matches
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.redirect('/admin/'); // ✅ Stops execution
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        if (!token) {
            return res.redirect('/admin/'); // ✅ Stops execution
        }

        // Store token in a cookie
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1-hour expiry
        console.log(token);

        return res.redirect('/admin/dashboard'); // ✅ Final response, no further execution
    } catch (error) {
        console.error("Login Error:", error);
        return res.redirect('/admin/'); // ✅ Ensure execution stops in case of errors
    }
};

    
      logout= async (req, res) => {
        res.clearCookie('token');
        res.redirect('/admin/');
      };
    }    

module.exports = new AdminAuthController();