const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mongoose models
const User = require('../models/user');

const checkAuth = require('../middleware/check-auth');
const checkAdmin = require('../middleware/check-isAdmin');
const userController = require('../controllers/user');

const router = express.Router();

router.post("/signup", checkAuth, checkAdmin, userController.userSignUp);

router.post("/login", userController.userLogin);

module.exports = router;
