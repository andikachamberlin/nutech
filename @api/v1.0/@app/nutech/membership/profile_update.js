const express = require('express');
const router = express.Router();

const { runQuery } = require('../../../../../config/dbc');
const { debug, console_dev } = require('../../../../../config/debug');
const { checkRequired } = require('../../../../../config/functions');

router.put('/', async (request, response) => {

    const verify = request.verify;

    try {

        const validation = checkRequired(request.body, [
            'first_name', 'last_name'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { first_name, last_name } = request.body;

        const data = await runQuery(`UPDATE user SET first_name=?, last_name=? WHERE email= ?`, [first_name, last_name, verify.email])

        if (data.affectedRows > 0) {

            const [user] = await runQuery('SELECT email, first_name, last_name, profile_image FROM user WHERE email = ?', [verify.email]);

            response.status(200).json({
                "status": 0,
                "message": "Update Pofile berhasil",
                "data": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "profile_image": user.profile_image
                }
            })
        } else {
            response.status(400).json({
                error: 'Update Gagal'
            })
        }

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;