const User = require('../models/User');
const { generateToken, getCookieOptions } = require('../middlewares/jwtAuth');

// LOGIN
exports.login = async (req, res) => {
   const { email, password } = req.body;

   try {
      const user = await User.findOne({ email });

      if (!user) {
         return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Use the comparePassword method for hashed passwords
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
         return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Use the utility functions from jwtAuth middleware
      const token = generateToken(user);
      const cookieOptions = getCookieOptions();

      // Set JWT as HTTP-only cookie
      res.cookie("token", token, cookieOptions);

      res.status(200).json({ message: "You are loggedin" });

   } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
   }
};


// SIGNUP
exports.signup = async (req, res) => {
   const { name, email, password } = req.body;
   
   try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({ error: 'Email already registered' });
      }

      // Password will be automatically hashed by the User model pre-save middleware
      const newUser = new User({ name, email, password });
      await newUser.save();

      res.status(200).json({ message: 'User registered successfully', redirect: '/login' });
   } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Server error' });
   }
};

// LOGOUT
exports.logout = (req, res) => {
   try {
      // Clear the token cookie
      res.clearCookie('token');
      res.status(200).json({ message: 'Logout successful', redirect: '/login' });
   } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Server error' });
   }
};
