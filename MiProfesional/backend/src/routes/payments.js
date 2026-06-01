const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createPayment } = require('../controllers/paymentController');
const { handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/create', authenticate, createPayment);
router.post('/webhook', handleWebhook);

module.exports = router;
