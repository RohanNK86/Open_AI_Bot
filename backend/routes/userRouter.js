const express = require('express');
const router = express.Router();
const authController = require('./../controller/authController');

router.route('/signIN').post(authController.signIN);

module.exports = router; //middleware for the router 