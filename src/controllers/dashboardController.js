const db = require('../../database');

exports.dashboard = (req, res) => {
    // Determine which dashboard to show or show combined data based on role
    // For now, we fetch basic stats for everyone

    // Example: Count residents, pending payments, total funds
    const stats = {
        residents: 0,
        pendingPayments: 0,
        balance: 0
    };

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    // Parallel queries (or serialized for simplicity)
    db.serialize(() => {
        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'resident'", (err, row) => {
            if (!err) stats.residents = row.count;

            db.get('SELECT COUNT(*) as count FROM payments WHERE status = "pending"', (err, row) => {
                if (!err) stats.pendingPayments = row.count;

                // Calculate balances per fund type
                db.all(`SELECT fund_type, type, SUM(amount) as total FROM mutations GROUP BY fund_type, type`, (err, rows) => {
                    const balances = {
                        housing: 0,
                        social: 0,
                        rt: 0
                    };

                    if (!err) {
                        rows.forEach(r => {
                            if (r.fund_type) {
                                if (r.type === 'in') balances[r.fund_type] += r.total;
                                else balances[r.fund_type] -= r.total;
                            }
                        });
                    }

                    stats.balances = balances;
                    stats.totalBalance = balances.housing + balances.social + balances.rt;

                    // Fetch Monthly Cashflow for Chart (Current Year)
                    const currentYear = now.getFullYear();
                    const cashflow = {
                        income: Array(12).fill(0),
                        expense: Array(12).fill(0)
                    };

                    db.all(`
                        SELECT 
                            strftime('%m', date) as month, 
                            type, 
                            SUM(amount) as total 
                        FROM mutations 
                        WHERE strftime('%Y', date) = ?
                        GROUP BY month, type
                    `, [String(currentYear)], (err, mutationRows) => {
                        if (!err && mutationRows) {
                            mutationRows.forEach(row => {
                                const monthIndex = parseInt(row.month) - 1;
                                if (row.type === 'in') cashflow.income[monthIndex] = row.total;
                                else if (row.type === 'out') cashflow.expense[monthIndex] = row.total;
                            });
                        }
                        stats.cashflow = cashflow;

                        if (req.session.role === 'resident') {
                            // Get all approved payments for this user in the current year
                            const userId = req.session.userId;
                            db.all("SELECT month_paid_for FROM payments WHERE user_id = ? AND status = 'approved' AND month_paid_for LIKE ?", [userId, `${currentYear}-%`], (err, payments) => {
                                const statuses = [];
                                const paidMonths = new Set();

                                if (!err && payments) {
                                    payments.forEach(p => {
                                        const months = p.month_paid_for.split(',').map(m => m.trim());
                                        months.forEach(m => paidMonths.add(m));
                                    });
                                }

                                // Check Current Month
                                const isCurrentMonthPaid = paidMonths.has(currentMonth);

                                // Check Arrears (Previous months of current year)
                                let hasArrears = false;
                                for (let m = 0; m < now.getMonth(); m++) {
                                    const checkMonth = currentYear + '-' + String(m + 1).padStart(2, '0');
                                    if (!paidMonths.has(checkMonth)) {
                                        hasArrears = true;
                                        break;
                                    }
                                }

                                if (hasArrears) statuses.push('MENUNGGAK');
                                if (!isCurrentMonthPaid) statuses.push('BELUM BAYAR');
                                if (statuses.length === 0) statuses.push('LUNAS');

                                stats.residentStatus = statuses;
                                render();
                            });
                        } else {
                            render();
                        }
                    });
                });
            });
        });
    });

    function render() {
        res.render('dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            path: '/dashboard',
            stats: stats,
            currentMonthLabel: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        });
    }
};
