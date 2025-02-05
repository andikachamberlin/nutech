const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');

router.get('/', async (request, response) => {

    const verify = request.verify;

    try {

        const [data] = await runQuery('SELECT balance FROM user WHERE email=?', [verify.email]);
        
        response.status(200).json({
            "status": 0,
            "message": "Get Balance Berhasil",
            "data": {
                "balance": data.balance
            }
        })

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;