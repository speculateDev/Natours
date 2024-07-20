const path = require('path');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Load environment variable
dotenv.config({ path: './config.env' });

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//  GLOBAL MIDDLEWARES
//  Serving Static Files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://js.stripe.com/v3/',
        'blob:'
      ],
      workerSrc: ['blob:'],
      connectSrc: ["'self'", 'https://*.mapbox.com'],
      frameSrc: ["'self'", 'https://js.stripe.com/']
    }
  })
);

// Developement Login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//  LIMIT requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again in an hour!'
});
app.use('/api', limiter);

//  Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Update Form
app.use(cookieParser());

// DATA SANITAZATION vs NoSQL query injection
app.use(mongoSanitize());

// DATA SANITAZATION vs XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'maxGroupSize',
      'price'
    ]
  })
);

// Test Middleware
app.use((req, res, next) => {
  // console.log(req.headers  );
  console.log('Hello from the middleware!');
  // console.log(req.cookies);
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();
  next();
});

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTES
// API Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Gets Executed if the prevs not executed! => write it after!!
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next automatically recognize the err
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error middlleware
app.use(globalErrorHandler);

module.exports = app;
