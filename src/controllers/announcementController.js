const db = require('../../database');

exports.listAnnouncements = (req, res) => {
    const category = req.query.category || 'all';
    let sql = 'SELECT * FROM announcements';
    let params = [];

    if (category !== 'all') {
        sql += ' WHERE category = ?';
        params.push(category);
    }
    sql += ' ORDER BY date_created DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).send('Database Error');
        res.render('announcements', {
            title: 'Informasi & Pengumuman',
            user: req.session.user,
            announcements: rows,
            category: category,
            path: '/announcements'
        });
    });
};

exports.createAnnouncement = (req, res) => {
    const { title, content, category } = req.body;
    db.run('INSERT INTO announcements (title, content, category) VALUES (?, ?, ?)',
        [title, content, category],
        (err) => {
            if (err) console.error(err);
            res.redirect('/announcements');
        }
    );
};

exports.deleteAnnouncement = (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM announcements WHERE id = ?', [id], (err) => {
        if (err) console.error(err);
        res.redirect('/announcements');
    });
};
