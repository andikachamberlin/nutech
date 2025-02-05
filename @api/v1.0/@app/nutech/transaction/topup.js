const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequired, isValidNumber } = require('../../../../../config/functions');

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
    
        if(amount === 'denied'){
            return response.status(400).json({
                "status": 102,
                "message": "Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0",
                "data": null
            })
        }
        
        const [balance] = await runQuery('SELECT balance FROM user WHERE email=?', [verify.email]);

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