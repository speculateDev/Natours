const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'Success',
//     requested: req.requestTime,
//     resullts: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  // Allow Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user;
  next();
};

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id)
//     .select('-__v')
//     .populate({
//       path: 'user',
//       select: '-__v'
//     })
//     .populate({
//       path: 'tour',
//       select: '-__v'
//     });

//   res.status(200).json({
//     status: 'Success',
//     data: {
//       review
//     }
//   });
// });

exports.createReview = factory.createOne(Review);
// THe populate is applied through middleware
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
