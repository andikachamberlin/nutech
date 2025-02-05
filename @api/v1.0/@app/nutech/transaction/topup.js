const express = require('express');
const router = express.Router();
const sprintf = require("sprintf-js").sprintf;

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequired, isValidNumber, dynamicDateTime, convertDate } = require('../../../../../config/functions');

router.post('/', async (request, response) => {

    const verify = request.verify;

    try {

        const validation = checkRequired(request.body, [
            'top_up_amount'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { top_up_amount } = request.body;

        const amount = isValidNumber(Number(top_up_amount))

        console_dev('amount', amount)

        if (amount === 'denied') {
            return response.status(400).json({
                "status": 102,
                "message": "Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0",
                "data": null
            })
        }

        const [count] = await runQuery('SELECT COUNT(id) as count FROM topup', []);
        const [balance] = await runQuery('SELECT balance FROM user WHERE email=?', [verify.email]);

        const count_fix = count.count === 0 ? 1 : count.count;
        const formatted_number = `INV${convertDate(dynamicDateTime.dateFilter)}` + '-' + sprintf("%03d", count_fix);
        const balance_sum = balance.balance + amount;

        const topup = await runQuery(`INSERT INTO topup (id_user, status, invoice_number, amount, transaction_type) VALUES (?, ?, ?, ?, ?)`, [verify.id, 'active', formatted_number, amount, 'TOPUP'], true);
        const data = await runQuery(`UPDATE user SET balance=? WHERE email= ?`, [balance_sum, verify.email], true);

        if (topup.affectedRows > 0 && data.affectedRows > 0) {

            const [user] = await runQuery('SELECT balance FROM user WHERE email=?', [verify.email]);

            response.status(200).json({
                "status": 0,
                "message": "Top Up Balance berhasil",
                "data": {
                    "balance": user.balance
                }
            })

        } else {

            response.status(400).json({
                error: 'Topup Gagal'
            })

        }

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;