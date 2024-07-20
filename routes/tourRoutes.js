const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

// tourRouter.param('id', tourController.idCheck);

// POST /tour/1212351/reviews
// GET /tour/1212351/reviews
// GET /tour/1212351/reviews/5645dsfs5

// tourRouter
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

tourRouter.use('/:tourId/reviews', reviewRouter); // similar to MOUNTING ROUTER (CHECK APP)

tourRouter.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route('/get-stats').get(tourController.getTourStats);
tourRouter
  .route('/get-stats/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'user'),
    tourController.getMonthlyPlan
  );

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

tourRouter.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// .post(tourController.checkBody, tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = tourRouter;
