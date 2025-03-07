const User = require("../../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


class AdminAuthController {
    login = async (req, res) => {
        try {
          const userId = req.user;
        const { email, password } = req.body;
      
        if (!email || !password) {
          res.redirect('/admin/');
        }
      
        
        
          const user = await User.findOne({ email });
          console.log(user);
          if (!user || user.role !== 'admin') {
            res.redirect('/admin/');
          }
      
        //    if password not match
          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log(isPasswordValid);
          if (!isPasswordValid) {
            res.redirect('/admin/');
            
    
          }
          const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.SECRET_KEY, {
            expiresIn: '1h',
          });
    
          console.log(token);
      
          // Store token in a cookie
          res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour expiry
    
          console.log(token);
      
          res.redirect('/admin/dashboard'); // Redirect to the dashboard or any protected page
        } catch (error) {
          console.error('Login error:', error);
          res.redirect('/admin/');
        }
      };
    
      logout= async (req, res) => {
        res.clearCookie('token');
        res.redirect('/admin/');
      };
    }    

module.exports = new AdminAuthController();