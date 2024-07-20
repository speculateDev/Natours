const express = require('express');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const bookingRouter = express.Router();

bookingRouter.use(authController.protect);

bookingRouter.get('/checkout-session/:tourID', bookingController.getCheckoutSession);

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
