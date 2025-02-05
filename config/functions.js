const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const jwt = require("jsonwebtoken");

function capitalizeAndFormat(str) {
    return str
        .replace(/_/g, ' ')  // Ganti underscore dengan spasi
        .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize setiap kata
}

function emailValidator(email) {

	function sanitizeEmail(email) {
		return email.trim().toLowerCase();
	}

	function isValidEmail(email) {
		const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|icloud\.com|militant.co\.id)$/;
		return regex.test(email);
	}

	const sanitizedEmail = sanitizeEmail(email);
	const isValid = isValidEmail(sanitizedEmail);

	if (!isValid) {
		return true
	}
}

function checkRequired(body, fields) {
    for (const field of fields) {
        const value = entities.encode(body[field]);
        
        if (!value || value.trim() === '') {
            return capitalizeAndFormat(`${field} tidak boleh kosong`);
        }
    }
    return null; // Semua field valid
}

async function generateToken(auth) {
    try {
        const token = await new Promise((resolve, reject) => {
            jwt.sign(auth, process.env.ENV_TOKEN_KEY, { expiresIn: "90d" }, (error, token) => {
                if (error) reject(error);
                else resolve(token);
            });
        });
        return token;
    } catch (error) {
        console.error("JWT Error:", error);
        throw error;
    }
}

module.exports = {
	generateToken,
	capitalizeAndFormat,
	checkRequired,
	emailValidator
};