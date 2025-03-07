const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


class AdminAuthController {
    login = async (req, res) => {
        try {
        const { email, password } = req.body;
      
        if (!email || !password) {
          return res.render('Admin/index', { error: 'Please enter both email and password' });
        }
      
        
        
          const user = await User.findOne({ email });
          console.log(user);
          if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Invalid email or password' });
          }
      
        //    if password not match
          const isPasswordValid = await bcrypt.compare(password, user.password);
          console.log(isPasswordValid);
          if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
            
    
          }
          const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.SECRET_KEY, {
            expiresIn: '1h',
          });
    
          console.log(token);
      
          // Store token in a cookie
          res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour expiry
    
          console.log(token);
      
          return res.status(200).json({ message: 'Login successful' }); // Redirect to the dashboard or any protected page
        } catch (error) {
          console.error('Login error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
      };
    
      logout= async (req, res) => {
        res.clearCookie('token');
        return res.status(200).json({ message: 'Logged out' });
      };
    }    

module.exports = new AdminAuthController();