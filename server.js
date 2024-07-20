const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

// Declared before so It can catch the ERR
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! ⚡⚡ Shutting down...');
  console.log(err.name, err.message);

  // server.close(() => {
  process.exit(1);
  // });
});

//declared after importing the app
dotenv.config({ path: './config.env' });
// console.log(process.env);

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

// useNewUrlParser: true,
// useCreateIndex: true,
// useFindAndModify: false

mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');
});
// .catch(err => console.error(err));

// const testTour = new Tour({
//   name: 'The park camper',
//   price: 997
// });

// testTour
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log(`ERROR: !!${err}`);
//   });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handling Errors outside Express
// Event listeners
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! ⚡⚡ Shutting down...');
  console.log(err.name, err.message, err);

  server.close(() => {
    process.exit(1);
  });
});
