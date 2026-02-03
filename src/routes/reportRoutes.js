const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const upload = require('../middleware/upload');

const requireLogin = (req, res, next) => {
    if (req.session.userId) next();
    else res.redirect('/login');
};

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') next();
    else res.status(403).send('Forbidden');
};

router.get('/reports', requireLogin, reportController.viewReports);
router.post('/mutations/add', requireAdmin, upload.single('proof_image'), reportController.addMutation);

// Also mount /mutations to same controller if linked from sidebar
router.get('/mutations', requireAdmin, reportController.viewMutations);
router.get('/matrix', requireAdmin, reportController.viewPaymentMatrix);

module.exports = router;
