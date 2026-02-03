const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const upload = require('../middleware/upload');

const requireLogin = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

// Resident Routes
router.get('/my-payments', requireLogin, paymentController.myPayments);
router.post('/submit', requireLogin, upload.single('proof_image'), paymentController.submitPayment);

// Admin Routes
router.get('/payments', requireAdmin, paymentController.listPayments);
router.post('/payments/update', requireAdmin, paymentController.updateStatus);

module.exports = router;
