const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const upload = require('../middleware/upload');

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

router.get('/', announcementController.listAnnouncements);
router.post('/add', requireAdmin, upload.single('image'), announcementController.createAnnouncement);
router.get('/delete/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;
