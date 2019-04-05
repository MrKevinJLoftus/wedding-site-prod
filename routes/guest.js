const express = require('express');

// Mongoose models
const checkAuth = require('../middleware/check-auth');
const guestController = require('../controllers/guest');

const router = express.Router();

router.get('/', checkAuth, guestController.getGuests);
router.post('/', checkAuth, guestController.addGuests);

module.exports = router;
