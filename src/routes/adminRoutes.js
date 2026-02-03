const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

router.get('/', requireAdmin, adminController.listAdmins);
router.post('/add', requireAdmin, adminController.addAdmin);
router.get('/delete/:id', requireAdmin, adminController.deleteAdmin);

module.exports = router;
