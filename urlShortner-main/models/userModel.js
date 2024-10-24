const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name field is required'],
  },
  email: {
    type: String,
    required: [true, 'Email field is required'],
    unique: [true, 'Email already exists'],
    lowercase: true,
    validate: {
      validator: function(v) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(v);
      },
      message: 'Invalid email',
    },
  },
  password: {
    type: String,
    required: [true, 'Password field is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(v);
      },
      message: 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'Confirm Password field is required'],
    validate: {
      validator: function(v) {
        return v === this.password;
      },
      message: 'Passwords do not match',
    },
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined; // Remove confirmPassword field
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;