const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Create indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ lastSeen: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 