const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequired } = require('../../../../../config/functions');

router.post('/', async (request, response) => {

    const verify = request.verify;
    
    try {

        const validation = checkRequired(request.body, [
            'service_code'
        ]);
    
        if (validation) { return response.status(400).json({ error: validation }) }
    
        const { service_code } = request.body;
        
        const [balance] = await runQuery('SELECT  FROM user WHERE email=?', [verify.email]);

        const balance_sum = balance.balance + amount;

        const data = await runQuery(`UPDATE user SET balance=? WHERE email= ?`, [balance_sum, verify.email]);

        if (data.affectedRows > 0) {

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