
const winston = require('winston');
const path = require('path');

const timezone = () => {
    return new Date().toLocaleString('ID', {
        timeZone: 'Asia/Jakarta'
    });
}

const logger = winston.createLogger({
    level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: timezone }),
		winston.format.json()
	),
    transports: [
		new winston.transports.File({ filename: path.resolve('application.log') }),
    ],
});

module.exports = {
	logger
};
