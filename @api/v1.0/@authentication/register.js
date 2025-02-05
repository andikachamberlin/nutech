const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");

const { runQuery } = require('../../../config/dbc');
const { debug } = require('../../../config/debug');
const { checkRequired, emailValidator } = require('../../../config/functions');

router.post('/', async (request, response) => {

    try {

        const validation = checkRequired(request.body, [
            'email', 'first_name', 'last_name', 'password'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { email, first_name, last_name, password } = request.body;

        const check_email = emailValidator(email);

        if (check_email) {
            return response.status(400).json({
                status: 102,
                message: "Paramter email tidak sesuai format",
                data: null
            })
        }

        if (password.length < 8) {
            return response.status(400).json({
                error: 'Password Length minimal 8 karakter'
            })
        }

        const password_hash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)

        const check_user = await runQuery('SELECT email FROM user WHERE email = ?', [email]);

        if (check_user.length !== 0) { return response.status(400).json({ error: 'Email Sudah Digunakan' }) }

        const data = await runQuery(`
            INSERT INTO user (level, access, status, email, first_name, last_name, password) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['admin', 'global', 'active', email, first_name, last_name, password_hash]);

        if (data.affectedRows > 0) {
            response.status(200).json({
                status: 0,
                message: "Registrasi berhasil silahkan login",
                data: null
            })
        } else {
            response.status(400).json({
                error: 'Registrasi Gagal'
            })
        }
    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;