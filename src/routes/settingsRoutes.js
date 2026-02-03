const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

router.get('/', requireAdmin, settingsController.getSettings);
router.post('/update', requireAdmin, settingsController.updateSettings);

module.exports = router;
