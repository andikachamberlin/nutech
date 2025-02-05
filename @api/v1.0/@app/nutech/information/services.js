const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');

router.get('/', async (request, response) => {

    try {

        const data = await runQuery('SELECT service_code, service_name, service_icon, service_tariff FROM services', []);
        
        response.status(200).json({
            "status": 0,
            "message": "Sukses",
            "data": data
          })

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;