const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');

// external routing files
const userRoutes = require('./routes/user');
const rsvpRoutes = require('./routes/rsvp');
const guestRoutes = require('./routes/guest');

const app = express();

// mongoose.connect(process.env.MONGO_ATLAS_CS)
mongoose.connect(process.env.MLAB_CS)
  .then(() => {
    console.log('Connected to database!');
  })
  .catch((err) => {
    console.log('Connection failed!');
    console.log(err);
  });

app.use((req, res, next) => {
  if (!req.get('x-forwarded-proto') || req.get('x-forwarded-proto') === 'https') {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(expressValidator());
app.use("/", express.static(path.join(__dirname, "wedding-site")));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  next();
});

app.use("/api/user", userRoutes)
app.use("/api/rsvp", rsvpRoutes);
app.use("/api/guest", guestRoutes);
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "wedding-site", "index.html"));
});

// Custom error handler
app.use(function(err, req, res, next) {
  // Any request to this server will get here, and will send an HTTP
  // response with the error message provided
  console.log(err);
  res.status(500).json({ message: err.message });
});

module.exports = app;
