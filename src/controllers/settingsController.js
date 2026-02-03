const db = require('../../database');

exports.getSettings = (req, res) => {
    db.all('SELECT * FROM settings', (err, rows) => {
        if (err) return res.status(500).send('Database Error');

        // Convert array to object for easier access in view
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });

        res.render('settings', {
            title: 'Pengaturan Iuran',
            user: req.session.user,
            settings: settings,
            path: '/settings'
        });
    });
};

exports.updateSettings = (req, res) => {
    const { housing_dues, social_dues, rt_dues } = req.body;

    const updates = [
        { key: 'housing_dues', value: housing_dues },
        { key: 'social_dues', value: social_dues },
        { key: 'rt_dues', value: rt_dues }
    ];

    db.serialize(() => {
        const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
        updates.forEach(item => {
            stmt.run(item.value, item.key);
        });
        stmt.finalize((err) => {
            if (err) return res.status(500).send('Database Error');
            res.redirect('/settings?success=Pengaturan berhasil disimpan');
        });
    });
};
