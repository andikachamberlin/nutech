const express = require('express');
const router = express.Router();
const sprintf = require("sprintf-js").sprintf;

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequired, dynamicDateTime, convertDate } = require('../../../../../config/functions');

router.post('/', async (request, response) => {

    const verify = request.verify;

    try {

        const validation = checkRequired(request.body, [
            'service_code'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { service_code } = request.body;

        const check_service = await runQuery('SELECT service_code, service_name, service_tariff FROM services WHERE service_code=?', [service_code]);
        const [service] = check_service;
        if (check_service.length === 0) {
            return response.status(400).json({
                "status": 102,
                "message": "Service atas Layanan tidak ditemukan",
                "data": null
            })
        }

        const [count] = await runQuery('SELECT COUNT(id) as count FROM transaction', []);

        const [balance] = await runQuery('SELECT balance FROM user WHERE email=?', [verify.email]);

        const count_fix = count.count === 0 ? 1 : count.count + 1;
        const formatted_number = `INV${convertDate(dynamicDateTime.dateFilter)}` + '-' + sprintf("%03d", count_fix);
        if (balance.balance < 0) {
            return response.status(400).json({
                error: 'Balance Tidak Cukup'
            })
        }
        const balance_sum = balance.balance - service.service_tariff;

        const transaction = await runQuery(`
            INSERT INTO transaction (id_user, status, invoice_number, service_code, service_name, transaction_type, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [verify.id, 'active', formatted_number, service.service_code, service.service_name, 'PAYMENT', service.service_tariff], true);
        const data = await runQuery(`UPDATE user SET balance=? WHERE email= ?`, [balance_sum, verify.email], true);

        if (transaction.affectedRows > 0 && data.affectedRows > 0) {

            const [output] = await runQuery('SELECT invoice_number, service_code, service_code, service_name, transaction_type, total_amount, created_at FROM transaction WHERE invoice_number=?', [formatted_number]);

            response.status(200).json({
                "status": 0,
                "message": "Transaksi berhasil",
                "data": {
                    "invoice_number": output.invoice_number,
                    "service_code": output.service_code,
                    "service_name": output.service_name,
                    "transaction_type": output.transaction_type,
                    "total_amount": output.total_amount,
                    "created_on": output.created_at
                }
            })

        } else {

            response.status(400).json({
                error: 'Transaction Gagal'
            })

        }

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;