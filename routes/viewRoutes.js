const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const viewRouter = express.Router();

viewRouter.get('/me', authController.protect, viewController.getMe);
viewRouter.get('/my-tours', authController.protect, viewController.getMyTours);
// this is for the form/url request
// viewRouter.post('/submit-user-data', authController.protect, viewController.updateUserData);

viewRouter.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

viewRouter.use(authController.isLoggedIn);

viewRouter.get('/login', viewController.getLoginPage);
viewRouter.get('/signup', viewController.getSignupPage);
viewRouter.get('/tours/:slug', viewController.getTour);

module.exports = viewRouter;
