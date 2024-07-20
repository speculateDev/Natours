const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

// const User = require('../models/usersModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template

  // 3) Render the template Using the Data from (1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data, for the requested tour(including reviews and tour Guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginPage = (req, res) => {
  //Render the login Page
  res.status(200).render('login', {
    title: 'Login'
  });
};

exports.getSignupPage = (req, res) => {
  //Render the signup Page
  res.status(200).render('signup', {
    title: 'SignUp'
  });
};

exports.getMe = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with returned IDs
  const tourIds = bookings.map(el => el.tour); // the tour is an id itself
  const tours = await Tour.find({ _id: { $in: tourIds } });

  // console.log(tours);

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     {
//       new: true,
//       runValidators: true
//     }
//   );

//   res.render('account', {
//     title: 'My Account',
//     user: updatedUser // So on rendered page, we'll get the new data
//   });
// });
