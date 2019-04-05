const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authError = new Error('Your username or password is incorrect.');

exports.userSignUp = (req, res, next) => {
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
            const token = jwt.sign({username: result.username, userId: result._id},
              process.env.JWT_KEY,
              { expiresIn: '4h' }
            );
            res.status(200).json({
              token: token,
              expiresIn: 3600,
              userId: result._id
            });
          })
          .catch(err => {
            console.log(err);
            next(err);
          });
      });
}

exports.userLogin = (req, res, next) => {
  console.log(`${req.body.username} logging in`);
  let fetchedUser;
  User.findOne({ username: req.body.username })
    .then(user => {
      if (!user) {
        next(authError);
      }
      // found user
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (!result) {
        next(authError);
      }
      // hashes match, correct password entered
      // time to generate a JSON token for the user
      // using node package jsonwebtoken
      // token includes the userId, but also passing it in the response
      // this is a performance optimization
      const token = jwt.sign({username: fetchedUser.username, userId: fetchedUser._id, email: fetchedUser.email},
          process.env.JWT_KEY,
          { expiresIn: '4h' }
        );
        console.log('login successful!');
        res.status(200).json({
          token: token,
          expiresIn: 3600,
          userId: fetchedUser._id
        });
    })
    .catch(err => {
      next(authError);
    });
  }
