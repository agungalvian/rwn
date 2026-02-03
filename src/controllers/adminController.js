const db = require('../../database');
const bcrypt = require('bcrypt');

exports.listAdmins = (req, res) => {
    db.all("SELECT * FROM users WHERE role = 'admin' ORDER BY username ASC", (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.render('admins', {
            title: 'Kelola Admin',
            user: req.session.user,
            admins: rows,
            path: '/admins'
        });
    });
};

exports.addAdmin = (req, res) => {
    const { username, password, full_name } = req.body;
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).send('Error hashing password');

        const sql = `INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, 'admin', ?)`;
        db.run(sql, [username, hash, full_name], (err) => {
            if (err) {
                console.error(err);
                return res.redirect('/admins?error=Username sudah digunakan');
            }
            res.redirect('/admins?success=Admin berhasil ditambahkan');
        });
    });
};

exports.deleteAdmin = (req, res) => {
    const id = req.params.id;

    // Prevent self-deletion
    if (parseInt(id) === req.session.userId) {
        return res.redirect('/admins?error=Tidak dapat menghapus akun Anda sendiri');
    }

    db.run("DELETE FROM users WHERE id = ? AND role = 'admin'", [id], (err) => {
        if (err) console.error(err);
        res.redirect('/admins?success=Admin berhasil dihapus');
    });
};
