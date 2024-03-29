const express = require('express');

// Mongoose models
const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-isAdmin');
const guestController = require('../controllers/guest');

const router = express.Router();

router.get('/', checkAuth, guestController.getGuests);
router.post('/', checkAuth, checkAdmin, guestController.addGuests);

module.exports = router;
