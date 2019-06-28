const express = require('express');

// Mongoose models
const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-isAdmin');
const adminController = require('../controllers/admin');

const router = express.Router();

router.get('/rsvp', checkAuth, adminController.runRsvpReport);
router.get('/guest', checkAuth, adminController.runGuestReport);

module.exports = router;
