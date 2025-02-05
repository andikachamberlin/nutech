const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");

const { runQuery } = require('../../../config/dbc');
const { debug, console_dev } = require('../../../config/debug');
const { checkRequired, emailValidator, generateToken } = require('../../../config/functions');

router.post('/', async (request, response) => {

    try {

        const validation = checkRequired(request.body, [
            'email', 'password'
        ]);

        if (validation) { return response.status(400).json({ error: validation }) }

        const { email, password } = request.body;

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

        const user = await runQuery('SELECT id, level, access, email FROM user WHERE email = ? AND password =?', [email, password_hash]);

        if (user.length === 0) { 
            return response.status(401).json({
                status: 103,
                message: "Username atau password salah",
                data: null
            }) 
        }

        let auth = {
            id: user[0].id,
            level: user[0].level,
            access: user[0].access,
            email: user[0].email,
        }
        const token = await generateToken(auth);
        
        response.status(200).json({
            status: 0,
            message: "Login Sukses",
            data: {
              token: token
            }
        })

    } catch (error) {

        response.status(400).json({
            error: debug(request.baseUrl, error)
        })

    }

});

module.exports = router;