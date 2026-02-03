const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

// Middleware to check if user is admin should be applied in server.js or here
const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

router.get('/', requireAdmin, residentController.listResidents);
router.post('/add', requireAdmin, residentController.addResident);
router.get('/edit/:id', requireAdmin, residentController.editResidentPage);
router.post('/edit/:id', requireAdmin, residentController.updateResident);
router.get('/delete/:id', requireAdmin, residentController.deleteResident);

module.exports = router;
