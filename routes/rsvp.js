const express = require('express');

// Mongoose models
const RSVP = require('../models/rsvp');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/respond', checkAuth, (req, res, next) => {
  const rsvpToSave = new RSVP({
      username: req.userData.username,
      comments: req.body.comments,
      isComing: req.body.isComing
  });
  rsvpToSave.save()
    .then(result => {
        res.status(200).json({
            message: "Successfully saved RSVP.",
            rsvpData: result
        });
    })
    .catch(err => {
        console.log("Error! " + err);
        res.status(500).json({
            message: "RSVP failed to save!",
            rsvpData: null
        });
    });
});

module.exports = router;
