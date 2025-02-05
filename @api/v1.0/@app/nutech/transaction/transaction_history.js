const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequiredNumber } = require('../../../../../config/functions');

router.get('/', async (request, response) => {

    try {

        const validation = checkRequiredNumber(request.query, [
            'offset'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { limit, offset } = request.query;

        let parsedLimit = Number(limit);
        let parsedOffset = Number(offset);

        if (!parsedLimit && parsedOffset) {
            parsedLimit = 500;
        }

        let query = 'SELECT invoice_number, transaction_type, service_name as description, total_amount, created_at as created_on FROM transaction ORDER BY created_at DESC';
        const queryParams = [];

        if (!isNaN(parsedLimit) && parsedLimit > 0) {
            query += ' LIMIT ?';
            queryParams.push(parsedLimit);

            if (!isNaN(parsedOffset) && parsedOffset > 0) {
                query += ' OFFSET ?';
                queryParams.push(parsedOffset);
            }
        }

        const data = await runQuery(query, queryParams);

        response.status(200).json({
            "status": 0,
            "message": "Get History Berhasil",
            "data": {
                "offset": parsedOffset || 0,
                "limit": parsedLimit || "Semua",
                "records": data
            }
        });

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;