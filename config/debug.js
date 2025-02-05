const { logger } = require("./logger")

function console_dev(desc, run) {
    process.env.ENV_PRODUCTION === 'false' ? console.log(`${desc} : `, run) : null
}

function debug(baseUrl, params) {
    const data = process.env.ENV_PRODUCTION === 'false' ? params.message : 'An unexpected error occurred'
    logger.error(baseUrl + ' : ' + params.message)
    console.log('debug : ' + baseUrl + ' : ' + params.message)
    return data
}

module.exports = {
    console_dev,
    debug
};
