const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please Provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // Only works for CREATE and SAVE!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

usersSchema.pre('save', async function(next) {
  if (!this.isModified('password')) next();

  // Hash the pass with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passConfirm from Database
  this.passwordConfirm = undefined;
  next();
});

usersSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  // it is possible that token be created before changedTimeStamp
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

usersSchema.pre(/^find/, function(next) {
  // Points to the current query
  // this.find({ active: true }); // as the others haven't been created with active
  this.find({ active: { $ne: false } });

  next();
});

usersSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  // this.password not available
  return await bcrypt.compare(candidatePassword, userPassword);
};

usersSchema.methods.changedPassword = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // console.log(`Changed Timestamp: ${changedTimeStamp}, JWT Timestamp: ${JWTTimestamp}`);

    // Changed means:
    return JWTTimestamp < changedTimeStamp; // 100 < 200 => (token issued < changed password)
  }

  // False means not changed
  return false;
};

usersSchema.methods.createPasswordResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // console.log(resetToken);

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', usersSchema);

module.exports = User;
