const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/usersModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const Email = require('./../utilities/email');

// const viewController = require('./viewController');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOpts = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true, // Sent only on an encrypted connection (https)
    httpOnly: true // can't be accessed or modified by browser
  };

  if (process.env.NODE_ENV === 'production') cookieOpts.secure = true;
  res.cookie('jwt', token, cookieOpts);

  const resObj = {
    status: 'Success',
    token,
    ...(user && { data: user })
  };

  // Removing Password from output
  user.password = undefined;
  res.status(201).json(resObj);
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    ...(req.body.role && { role: req.body.role })
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);

  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'Success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and pass EXIST
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if User EXIST
  const user = await User.findOne({ email }).select('+password');
  // User might not exist
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  // 3) If Evreything is ok, Send Token to the client
  createSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'Success',
  //   token
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  try {
    let token;
    // 1) Getting Token and check if it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError(`Your are not logged in! Please log in to get access.`, 401));
    }
    // 2) Verification token
    const jwtAsync = promisify(jwt.verify);
    const decoded = await jwtAsync(token, process.env.JWT_SECRET);

    // 3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this user, does no longer exist', 401));
    }

    // 4) Check if user changed password after the token issued
    if (currentUser.changedPassword(decoded.iat)) {
      return next(new AppError('User recently changed password! Please login again!', 401));
    }

    // Grant Access to protected Route
    req.user = currentUser;
    res.locals.user = req.user;
    next();
  } catch (err) {
    if (req.url.includes('/api')) console.log(err);
    else return res.redirect('/login');
  }
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verification of token
      const jwtAsync = promisify(jwt.verify);
      const decoded = await jwtAsync(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token issued
      if (currentUser.changedPassword(decoded.iat)) {
        return next();
      }

      // There is a Logged in USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      console.log(err);
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an arr // req.user.role been set by protect
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`You don't have permission to perform this action`, 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError(`There is no user with provided email address.`, 404));
  }

  // 2) Generate Random Token
  const resetToken = await user.createPasswordResetToken();

  // Deactivating Validators
  await user.save({ validateBeforeSave: false });

  try {
    // await sendEmail({
    //   email: user.email,
    //   message,
    //   subject: 'Your password reset token (valid for 10 min)'
    // });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If Token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPassword property for the user => through pre middleware
  // 4) Log the user in => send JWT
  createSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'Success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection => through protect middleWare req.user is filled
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if Posted currentPassword is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 400));
  }

  // 3) if so; update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // Two reasons to not use findUpdate => works only for(save,create)+validationNotWork because this.password is not defined when we update(mongoose keepNot object in memory) + pre middlewares won't get triggered (pass won't be encrypted + passChangedAt not exist)

  // 4) Log user in => send JWT
  createSendToken(user, 200, res);
});
