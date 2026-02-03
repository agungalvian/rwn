const db = require('../../database');

exports.viewReports = (req, res) => {
    const month = req.query.month || ''; // Expects '01', '02', etc.
    const year = req.query.year || '';   // Expects '2024'

    let whereClause = '';
    let params = [];

    if (month && year) {
        whereClause = 'WHERE date LIKE ?';
        params.push(`${year}-${month}-%`);
    } else if (year) {
        whereClause = 'WHERE date LIKE ?';
        params.push(`${year}-%`);
    } else if (month) {
        whereClause = 'WHERE date LIKE ?';
        params.push(`%-${month}-%`);
    }

    const query = `SELECT * FROM mutations ${whereClause} ORDER BY date DESC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).send('Database Error');

        const summary = {
            housing: { in: 0, out: 0, balance: 0 },
            social: { in: 0, out: 0, balance: 0 },
            rt: { in: 0, out: 0, balance: 0 },
            total: { balance: 0 }
        };

        const aggregatedMutations = [];
        const paymentGroups = {};

        rows.forEach(r => {
            // Calculate summary (always use individual records)
            if (r.fund_type && summary[r.fund_type]) {
                if (r.type === 'in') summary[r.fund_type].in += r.amount;
                else summary[r.fund_type].out += r.amount;
            }

            // Aggregate for display
            if (r.payment_id) {
                if (!paymentGroups[r.payment_id]) {
                    paymentGroups[r.payment_id] = {
                        ...r,
                        amount: 0,
                        fund_type: 'multiple', // Placeholder for aggregated funds
                        is_aggregated: true
                    };
                    aggregatedMutations.push(paymentGroups[r.payment_id]);
                }
                paymentGroups[r.payment_id].amount += r.amount;
            } else {
                aggregatedMutations.push(r);
            }
        });

        // Calculate balances
        summary.total = { in: 0, out: 0, balance: 0 };
        ['housing', 'social', 'rt'].forEach(type => {
            summary[type].balance = summary[type].in - summary[type].out;
            summary.total.in += summary[type].in;
            summary.total.out += summary[type].out;
            summary.total.balance += summary[type].balance;
        });

        res.render('reports', {
            title: 'Laporan Keuangan',
            user: req.session.user,
            mutations: aggregatedMutations,
            summary: summary,
            path: '/reports',
            filters: { month, year }
        });
    });
};

exports.viewMutations = (req, res) => {
    db.all('SELECT * FROM mutations ORDER BY date DESC', (err, rows) => {
        if (err) return res.status(500).send('Database Error');

        const aggregatedMutations = [];
        const paymentGroups = {};

        rows.forEach(r => {
            if (r.payment_id) {
                if (!paymentGroups[r.payment_id]) {
                    paymentGroups[r.payment_id] = {
                        ...r,
                        amount: 0,
                        fund_type: 'multiple',
                        is_aggregated: true
                    };
                    aggregatedMutations.push(paymentGroups[r.payment_id]);
                }
                paymentGroups[r.payment_id].amount += r.amount;
            } else {
                aggregatedMutations.push(r);
            }
        });

        res.render('mutations', {
            title: 'Mutasi Keuangan',
            user: req.session.user,
            mutations: aggregatedMutations,
            path: '/mutations'
        });
    });
};

exports.addMutation = (req, res) => {
    const { type, amount, description, category, fund_type, date } = req.body;
    const proof_image = req.file ? req.file.filename : null;
    const finalDate = date || new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.run('INSERT INTO mutations (type, amount, description, category, fund_type, date, proof_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [type, amount, description, category, fund_type, finalDate, proof_image],
        (err) => {
            if (err) console.error(err);
            res.redirect('/mutations'); // Redirect to mutations page after add
        }
    );
};

exports.viewPaymentMatrix = (req, res) => {
    const year = req.query.year || new Date().getFullYear();

    // Fetch all residents
    db.all("SELECT id, full_name, house_number FROM users WHERE role = 'resident' ORDER BY house_number ASC", (err, residents) => {
        if (err) return res.status(500).send('Database Error');

        // Fetch all approved payments for the selected year
        db.all("SELECT user_id, month_paid_for FROM payments WHERE status = 'approved' AND month_paid_for LIKE ?", [`%${year}-%`], (err, payments) => {
            if (err) return res.status(500).send('Database Error');

            // Map payments to a faster lookup structure
            const paymentMap = {};
            payments.forEach(p => {
                const months = p.month_paid_for.split(',').map(m => m.trim());
                months.forEach(m => {
                    if (!paymentMap[p.user_id]) paymentMap[p.user_id] = {};
                    paymentMap[p.user_id][m] = true;
                });
            });

            res.render('payment_matrix', {
                title: 'Data Tunggakan Warga',
                user: req.session.user,
                residents: residents,
                paymentMap: paymentMap,
                year: year,
                path: '/matrix'
            });
        });
    });
};
