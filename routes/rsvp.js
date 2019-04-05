const express = require('express');

// Mongoose models
const RSVP = require('../models/rsvp');
const checkAuth = require('../middleware/check-auth');
const rsvpController = require('../controllers/rsvp');
const { check, body, validationResult } = require('express-validator/check');

const router = express.Router();

router.post('/respond', checkAuth,
  [
    body('comments')
      .trim()
      .escape(),
    body('email').isEmail().normalizeEmail(),
    body('guests').isArray()
  ], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  rsvpController.guestResponseToRSVP);

router.get('/', checkAuth, rsvpController.findExistingRsvp);

module.exports = router;
