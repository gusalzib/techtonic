const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'tectonic_@87_user';

// Signup Controller
const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already in use' });

    const user = new User({ username, email, password });
    
    await user.save();
    res.status(201).json({ msg: 'Signup successful' });
  } catch (err) {
      console.log(err.message);
      
    res.status(500).json({ msg: 'Server error' });
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log(password);
    console.log(email);
    console.log(user.email);
    console.log(user.password);
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({ token, role: user.role, msg: 'Login successful' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};


// Logout Controller (stateless)
const logout = async (req, res) => {
  try {
    res.status(200).json({ msg: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
    signup,
    login,
    logout
};
