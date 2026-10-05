const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/signIN', authController.login);
router.post('/google', authController.google);

module.exports = router;
