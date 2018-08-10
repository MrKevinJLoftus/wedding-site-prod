const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mongoose models
const User = require('../models/user');

const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-isAdmin');

const router = express.Router();

router.post("/signup", checkAuth, checkAdmin, (req, res, next) => {
  // create a new user and store it in the database
  console.log("creating new user");
  bcrypt.hash(req.body.password, 15)
    .then(hash => {
      const user = new User({
        username: req.body.username,
        password: hash
      });
      user.save()
        .then(result => {
          let tempIsAdmin = (result.isAdmin) ? result.isAdmin : false;
          const token = jwt.sign({username: result.username, userId: result._id, isAdmin: tempIsAdmin},
            process.env.JWT_KEY,
            { expiresIn: '1h' }
          );
          res.status(200).json({
            token: token,
            expiresIn: 3600,
            userId: result._id,
            isAdmin: tempIsAdmin
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            message: "Signup failed!",
            error: err
          });
        });
    });

});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({ username: req.body.username })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Authorization failed."
        });
      }
      // found user
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (!result) {
        return res.status(401).json({
          message: "Authorization failed."
        });
      }
      // hashes match, correct password entered
      // time to generate a JSON token for the user
      // using node package jsonwebtoken
      // token includes the userId, but also passing it in the response
      // this is a performance optimization
      const token = jwt.sign({username: fetchedUser.username, userId: fetchedUser._id, isAdmin: fetchedUser.isAdmin},
          process.env.JWT_KEY,
          { expiresIn: '1h' }
        );
        res.status(200).json({
          token: token,
          expiresIn: 3600,
          username: fetchedUser.username,
          userId: fetchedUser._id,
          isAdmin: (fetchedUser.isAdmin === true)
        });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Authorization failed."
      });
    });
});

module.exports = router;
