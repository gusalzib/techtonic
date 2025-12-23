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
    // debug logs
    // console.log(password);
    // console.log(email);
    // console.log(user.email);
    // console.log(user.password);
    console.log(user.timezone);
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, userTz: user.timezone }, JWT_SECRET, {
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


// get user profile 
const getUserProfile = async (req, res) => {
  // The user ID is guaranteed to be available here due to the checkAuth middleware
      const userId = req.user.id;

      if (!userId) {
          // This should not happen if middleware works correctly, but it's a safeguard
          return res.status(401).json({ message: 'Unauthorized access.' });
      }
  try {
          // Find the user by ID. Use .select('-password') to exclude the password hash.
          const user = await User.findById(userId).select('-password');

          if (!user) {
              return res.status(404).json({ message: 'User not found.' });
          }

          // Return the user data
          res.status(200).json({ user });
      } catch (err) {
          res.status(500).json({ message: 'Server error while fetching user profile.' });
      }
}

/**
 * Update the logged-in user's profile.
 *
 * Fields allowed to update:
 *  - username
 *  - email
 *  - password
 *  - timezone
 *
 * Existing users might not have a `timezone` yet,
 * so we simply set it when they first update their profile.
 */
const updateUserProfile = async (req, res) => {
  // User id is injected by your auth middleware (from the JWT)
  const userId = req.user.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access.' });
  }

  try {
    // Load the user document
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { username, email, password, timezone } = req.body;

    // Only update the fields that are actually present in the body
    if (typeof username === 'string' && username.trim() !== '') {
      user.username = username.trim();
    }

    if (typeof email === 'string' && email.trim() !== '') {
      user.email = email.trim();
    }

    // check if the user tries to update their email to an email that is already in use
    // Email (only check if it changed)
    if (typeof email === 'string' && email.trim() !== '') {
      const normalizedEmail = email.trim();

      // Only do the uniqueness check if the email is actually different
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail });

        // If someone else already has this email, block it
        if (existing && existing._id.toString() !== userId.toString()) {
          return res.status(409).json({ msg: 'Email already in use' });
        }

        user.email = normalizedEmail;
      }
    }

    if (typeof password === 'string' && password.trim() !== '') {
      // Assigning password and calling `save()` ensures your pre-save
      // password hashing middleware runs (e.g., userSchema.pre('save', ...)).
      user.password = password;
    }

    if (typeof timezone === 'string' && timezone.trim() !== '') {
      // No problem if older users don't have this field yet;
      // this will just add it now.
      user.timezone = timezone.trim();
    }

    // Save the updated user (runs validators + pre-save hooks)
    await user.save();

    // Return a sanitized object (no password)
    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({ user: safeUser, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Server error while updating user profile.' });
  }
};

module.exports = {
    signup,
    login,
    logout,
    getUserProfile,
    updateUserProfile
};
