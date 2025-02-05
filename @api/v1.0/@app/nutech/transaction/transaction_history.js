const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequiredNumber } = require('../../../../../config/functions');

router.get('/', async (request, response) => {

    try {

        const verify = request.verify;

        const validation = checkRequiredNumber(request.query, [
            'offset'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { limit, offset } = request.query;

        const check_limit = Number(limit);

        let data;

        if(check_limit === 0){
            data = await runQuery('SELECT invoice_number, transaction_type, service_name as description, total_amount, created_at as created_on FROM transaction WHERE id_user=? ORDER BY created_at DESC', [verify.id]);
        } else {
            data = await runQuery('SELECT invoice_number, transaction_type, service_name as description, total_amount, created_at as created_on FROM transaction WHERE id_user=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [verify.id, limit, offset]);
        }

        response.status(200).json({
            "status": 0,
            "message": "Get History Berhasil",
            "data": {
                "offset": offset,
                "limit": limit,
                "records": data
            }
        })

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;