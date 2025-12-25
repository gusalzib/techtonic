const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: {type: String, required: true, unique: true},
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['regular', 'paid', 'admin'],
        default: 'regular',
    },
    createdAt: { type: Date, default: Date.now },
    timezone: {   
      type: String,
      default: 'Europe/Stockholm', // default until they change it
    }
});

// Hook that runs before a user document is saved to the database
userSchema.pre('save', async function (next) {
  
  // If the password hasn't been modified (e.g., when updating other fields), skip hashing
  if (!this.isModified('password')) return next();

    // Hash the password with bcrypt using a salt round of 10

    /*  a salt round (also known as the cost factor) determines how computationally intensive the hashing process will be. It's the number  of times the hashing algorithm is applied internally, making the hash slower to compute and therefore harder for attackers to brute-force.
        Higher salt rounds (e.g. 12, 14) make hashing slower but more secure.
        Lower salt rounds (e.g. 8) are faster but offer less protection.
        10 is a commonly used default that provides a good balance between security and performance. */
  this.password = await bcrypt.hash(this.password, 10);

  // Proceed to save the document
  next();
});

// Add a custom method to the user schema to compare entered password with the hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
  
  // Use bcrypt to compare the plain text password with the hashed password stored in the DB
  return bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
