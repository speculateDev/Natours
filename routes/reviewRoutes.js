const express = require('express');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const reviewRouter = express.Router({ mergeParams: true }); //tourId accessed

// POST /tour/21354fd5/reviews
// GET /tour/21354fd5/reviews
// POST /reviews
// the Get req would also be included in merged params

// Apply Auth to all operations
reviewRouter.use(authController.protect);

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

module.exports = reviewRouter;
