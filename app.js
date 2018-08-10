const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// external routing files
const userRoutes = require('./routes/user');
const rsvpRoutes = require('./routes/rsvp');


const app = express();

mongoose.connect(process.env.MONGO_ATLAS_CS)
  .then(() => {
    console.log('Connected to database!');
  })
  .catch(() => {
    console.log('Connection failed!');
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
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
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "wedding-site", "index.html"));
});

module.exports = app;
