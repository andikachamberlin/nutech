const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const jwt = require("jsonwebtoken");
const datetime = require('node-datetime');

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

function checkRequiredNumber(body, fields) {
    for (const field of fields) {
        const rawValue = body[field]; // Ambil nilai asli
        const value = Number(rawValue); // Ubah ke angka
        
        if (!rawValue || isNaN(value) || value < 0) {  
            return capitalizeAndFormat(`${field} tidak boleh kosong atau negatif`);
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

function isValidNumber(value) {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
        return value;
    } else {
        return 'denied';
    }
}

const dynamicDateTime = {
    get yearNow() {
        return new Date().getFullYear();
    },
    get monthNow() {
        return new Date().getMonth() + 1;
    },
    get todayNow() {
        return new Date().getDate();
    },
    get hourNow() {
        return datetime.create().format('H');
    },
    get minuteNow() {
        return datetime.create().format('M');
    },
    get secondNow() {
        return datetime.create().format('S');
    },
    get dateNow() {
        const date = new Date();
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    },
    get dateFilter() {
        return new Date().toLocaleDateString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    },
};

function convertDate(string) {

	tanggal = string.split("/")[0];
	bulan = string.split("/")[1];
	tahun = string.split("/")[2];

	return tanggal + "" + bulan + "" + tahun;
}


module.exports = {
	generateToken,
	capitalizeAndFormat,
	checkRequired,
    checkRequiredNumber,
	emailValidator,
    isValidNumber,
    dynamicDateTime,
    convertDate
};