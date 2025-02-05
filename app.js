/*------------------------------------------------------------------
[ENV]
-------------------------------------------------------------------*/
require('dotenv').config()
/*------------------------------------------------------------------
[End ENV]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Node Module]
-------------------------------------------------------------------*/
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const toobusy = require('toobusy-js');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const expectCt = require('expect-ct');
const Sentry = require('@sentry/node');
const { rateLimit } = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const cloudflare = require('cloudflare-express');
const { slowDown } = require('express-slow-down');
const useragent = require('express-useragent');
const morgan = require('morgan');
/*------------------------------------------------------------------
[End Node Module]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Config]
-------------------------------------------------------------------*/
let privateKey;
let certificate;

try {
    if (process.env.ENV_PRODUCTION === 'false') {
        privateKey = fs.readFileSync('./https/key.pem', 'utf8');
        certificate = fs.readFileSync('./https/cert.pem', 'utf8');
    } else {
        privateKey = fs.readFileSync('./https/ssl.key', 'utf8');
        certificate = fs.readFileSync('./https/ssl.crt', 'utf8');
    }
} catch (error) {
    console.error('Error reading SSL files:', error);
    process.exit(1); // Exit process if SSL files are not found
}

const credentials = { key: privateKey, cert: certificate };
const { port_app, port_app_ssl } = require('./config/port');
const { logger } = require('./config/logger')

const { cors_development, cors_production } = require('./config/cors');
/*------------------------------------------------------------------
[End Config]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Node Module Use]
-------------------------------------------------------------------*/
const app = express();
/*------------------------------------------------------------------
[End Node Module Use]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Rate Limiter]
-------------------------------------------------------------------*/
app.use(cloudflare.restore({update_on_start:false}));

app.set('trust proxy', 1)
app.set('trust proxy', 'loopback') // specify a single subnet
app.set('trust proxy', 'loopback, 123.123.123.123') // specify a subnet and an address
app.set('trust proxy', 'loopback, linklocal, uniquelocal') // specify multiple subnets as CSV
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']) // specify multiple subnets as an array

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // Jendela waktu 1 menit
	max: 100, // Maksimal 100 permintaan per IP dalam jendela waktu
	message: 'Terlalu banyak permintaan dari IP ini, coba lagi setelah beberapa waktu.',
	standardHeaders: true, // Mengirim informasi rate limit di header `RateLimit-*`
	legacyHeaders: false, // Menonaktifkan header `X-RateLimit-*`
	skipSuccessfulRequests: false, // Tidak melewati permintaan yang berhasil (default)
	keyGenerator(request, response) {
		if(process.env.ENV_PRODUCTION == 'true'){
			console.log('------------------------------------------------------------------')
			console.log('IP PRODUCTION LIMITER ADDRESS  :', request.cf_ip)
			console.log('------------------------------------------------------------------')
			if (!request.cf_ip) {
				console.error('Warning: request.cf_ip is missing!')
				return req.socket.remoteAddress
			}
	
			return request.cf_ip
		} else {
			console.log('------------------------------------------------------------------')
			console.log('IP DEVELOPMENT LIMITER ADDRESS  :', request.ip)
			console.log('------------------------------------------------------------------')
			if (!request.ip) {
				console.error('Warning: request.ip is missing!')
				return req.socket.remoteAddress
			}
	
			return request.ip
		}
	}
})

app.use(limiter)

const limiter_delay = slowDown({
	windowMs: 1 * 60 * 1000, // Jendela waktu 1 menit
	delayAfter: 100, // Tambahkan penundaan setelah 100 permintaan
	delayMs: () => 1000, // Tambahkan penundaan 1000ms (1 detik) untuk setiap permintaan tambahan setelah batas tercapai
	maxDelayMs: 10000, // Penundaan maksimum 10 detik
	skipFailedRequests: true, // Hanya menambah penundaan jika permintaan berhasil (200 status code)
	keyGenerator(request, response) {
		if(process.env.ENV_PRODUCTION == 'true'){
			console.log('------------------------------------------------------------------')
			console.log('IP PRODUCTION SLOWDOWN ADDRESS  :', request.cf_ip)
			console.log('------------------------------------------------------------------')
			if (!request.cf_ip) {
				console.error('Warning: request.cf_ip is missing!')
				return req.socket.remoteAddress
			}
	
			return request.cf_ip
		} else {
			console.log('------------------------------------------------------------------')
			console.log('IP DEVELOPMENT SLOWDOWN ADDRESS  :', request.ip)
			console.log('------------------------------------------------------------------')
			if (!request.ip) {
				console.error('Warning: request.ip is missing!')
				return req.socket.remoteAddress
			}
	
			return request.ip
		}
	}, 
})

app.use(limiter_delay)
/*------------------------------------------------------------------
[End Rate Limiter]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Cross Origin]
-------------------------------------------------------------------*/
let allowlist;

if (process.env.ENV_PRODUCTION === 'true') {
    allowlist = cors_production;
} else {
    allowlist = cors_development;
}

const isValidDomain = (domain) => {
    const regex = /^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]{1,5})?$/;
    return regex.test(domain);
};

allowlist = allowlist.filter(isValidDomain);

if (allowlist.length === 0) {
    throw new Error('Allowlist is empty or contains invalid domains!');
}

const corsOptionsDelegate = function (request, callback) {
    let corsOptions;

    if (allowlist.includes(request.header('Origin'))) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
        console.warn(`Blocked CORS request from origin: ${request.header('Origin')}`);
    }

    callback(null, corsOptions);
};

app.use(helmet());
app.disable('x-powered-by');
app.use(cors(corsOptionsDelegate));
/*------------------------------------------------------------------
[End Cross Origin]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[User Agent]
-------------------------------------------------------------------*/
app.use(useragent.express());

const allowedUserAgents = [
    'Mozilla/5.0',        // User-Agent umum (hampir semua browser modern)
    'Chrome/',            // Untuk Google Chrome
    'Firefox/',           // Untuk Mozilla Firefox
    'Safari/',            // Untuk Safari
    'Edge/',              // Untuk Microsoft Edge
    'Mobile/',            // Untuk perangkat mobile secara umum
    'Android',            // Untuk perangkat Android
    'iPhone',             // Untuk iPhone
    'iPad',               // Untuk iPad
    'Linux',              // Untuk Linux
    'Windows',            // Untuk Windows
    'Macintosh',          // Untuk macOS
    'Opera/',             // Untuk Opera
    'SamsungBrowser',     // Untuk browser Samsung pada Android
    'Brave/',             // Untuk Brave Browser
    'Vivaldi/',           // Untuk Vivaldi Browser
    'Ubuntu',             // Untuk sistem operasi Ubuntu (Linux)
    'Windows NT',         // Versi Windows NT
];

// Middleware untuk memvalidasi User-Agent
if(process.env.ENV_PRODUCTION === 'true' ){
	app.use((req, res, next) => {
		const userAgent = req.useragent;
	
		// Cek apakah User-Agent ada dalam daftar yang diizinkan
		const isAllowed = allowedUserAgents.some(agent => userAgent.source.includes(agent));
	
		if (isAllowed) {
			next(); // Lanjutkan ke route berikutnya
		} else {
			res.status(403).json({
				error: "Access Denied"
			});
		}
	});
}
/*------------------------------------------------------------------
[End User Agent]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Compression]
-------------------------------------------------------------------*/
app.use(compression({
	level: 6, // Kompresi yang seimbang untuk kinerja dan efisiensi
	threshold: 100 * 1000, // Hanya data > 100 KB yang dikompresi
	filter: (req, res) => {
		if (req.headers['x-no-compression']) {
			console.warn(`Compression skipped for request with header x-no-compression`);
			return false;
		}
		return compression.filter(req, res);
	}
}));
/*------------------------------------------------------------------
[End compression]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Morgan]
-------------------------------------------------------------------*/
app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
/*------------------------------------------------------------------
[End Morgan]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[ExpectCt]
-------------------------------------------------------------------*/
app.use(expectCt({
	enforce: true, // Menegakkan kebijakan CT
	maxAge: 30 * 24 * 60 * 60, // Set maxAge ke 30 hari untuk produksi
	reportUri: process.env.ENV_PRODUCTION === 'true' 
		? process.env.ENV_SERVER_PRODUCTION_BACKEND 
		: process.env.ENV_SERVER_DEV_BACKEND // Tentukan URI pelaporan yang sesuai
}));
/*------------------------------------------------------------------
[End ExpectCt]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Body Parser]
-------------------------------------------------------------------*/
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(hpp());
app.use(cookieParser());
/*------------------------------------------------------------------
[End Body Parser]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Url Protection]
-------------------------------------------------------------------*/
const urlProtection = (request, response, next) => {
	const block = /[!#$^*()\[\]{};'"\\|,<>]/;
  
	if (block.test(request.url)) {
	  // Hindari memberikan informasi terlalu banyak tentang serangan
	  return response.status(400).json({
		error: "Invalid URL parameters"
	  });
	}
  
	next();
};
  
app.use(urlProtection);
/*------------------------------------------------------------------
[End Url Protection]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Template Engine]
-------------------------------------------------------------------*/
hbs.registerPartials(__dirname + '/views/partials');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.static('export'));
/*------------------------------------------------------------------
[End Template Engine]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Sentry]
-------------------------------------------------------------------*/
if (process.env.ENV_PRODUCTION == 'true') {
	Sentry.init({
		dsn: process.env.ENV_SENTRY_SERVER,
		integrations: [
			// enable HTTP calls tracing
			new Sentry.Integrations.Http({ tracing: true }),
			// enable Express.js middleware tracing
			new Sentry.Integrations.Express({ app }),
			// Automatically instrument Node.js libraries and frameworks
			...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
		],

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});

	// RequestHandler creates a separate execution context, so that all
	// transactions/spans/breadcrumbs are isolated across requests
	app.use(Sentry.Handlers.requestHandler());
	// TracingHandler creates a trace for every incoming request
	app.use(Sentry.Handlers.tracingHandler());
	// The error handler must be before any other error middleware and after all controllers
	app.use(Sentry.Handlers.errorHandler({
		shouldHandleError(error) {
			if (error.status === 400 || error.status === 404 || error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504) {
				return true;
			}
			return false;
		},
	}));
	// Optional fallthrough error handler
	app.use(function onError(err, req, res, next) {
		// The error id is attached to `res.sentry` to be returned
		// and optionally displayed to the user for support.
		res.statusCode = 500;
		res.end(res.sentry + "\n");
	});
}
/*------------------------------------------------------------------
[End Sentry]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Timeout]
-------------------------------------------------------------------*/
const dynamicTimeout = (req, res, next) => {
    // Tentukan timeout berdasarkan URL
    if (req.originalUrl === '/long-running-task') {
        req.setTimeout(30000); // Timeout 30 detik untuk /long-running-task
    } else if (req.method === 'POST') {
        req.setTimeout(15000); // Timeout 15 detik untuk POST
    } else {
        req.setTimeout(7000); // Timeout 7 detik untuk endpoint lainnya
    }
    next();
};
  
const timeoutOptions = {
	onTimeout: function (request, response) {
	  	response.status(408).json({
			error : 'Request Timeout'
		});
	},
	onDelayedResponse: function (req, method, args, requestTime) {
	  	console.log(`Attempted to call ${method} after timeout`);
	},
	disable: ['write', 'setHeaders', 'send', 'json', 'end']
};
  
app.use(dynamicTimeout); // Atur timeout berdasarkan URL
app.use(timeout.handler(timeoutOptions));
/*------------------------------------------------------------------
[End Timeout]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Routes Root]
-------------------------------------------------------------------*/
app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']))
app.get('/ip', (request, response) => response.send(request.ip))
app.get('/ip_cf', (request, response) => response.send(request.cf_ip))
app.get('/', (request, response) => {
	return response.json({
		_: "API Nutech"
	});
});
/*------------------------------------------------------------------
[Routes Root]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Turnstile]
-------------------------------------------------------------------*/
const validateTurnStile = async (req, res, next) => {

	try {
		
		const token = req.body['c-cloudflare-response'];

		console.log('token', token)
	
		if(token === undefined){
			return res.status(200).json({ error: 'Cloudflare validation denied' });
		} else {
			const verifyEndpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
		
			const verified = await fetch(verifyEndpoint, {
				method: 'POST',
				body: `secret=${encodeURIComponent(process.env.ENV_API_TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				}
			})
			
			const data = await verified.json()
	
			if(data.success){
				next();
			} else {
				return res.status(200).json({ error: 'Cloudflare validation failed' });
			}
		}

	} catch (error) {
		return res.status(400).json({ error: err.message });
	}

};
/*------------------------------------------------------------------
[End Turnstile]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Routes]
-------------------------------------------------------------------*/
// authentication
const login = require('./@api/v1.0/@authentication/login');
const register = require('./@api/v1.0/@authentication/register');

app.use('/login', login);
app.use('/register', register);

// app
// const app_nutech_membership_profile_index = require('./@api/v1.0/@app/nutech/membership/profile');
// const app_nutech_membership_profile_update = require('./@api/v1.0/@authentication/register');
// const app_nutech_membership_profile_image = require('./@api/v1.0/@authentication/register');

// app.use('/profile', app_nutech_membership_profile_index);
// app.use('/profile/update', app_nutech_membership_profile_update);
// app.use('/profile/image', app_nutech_membership_profile_image);
/*------------------------------------------------------------------
[End Routes]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Server Busy]
-------------------------------------------------------------------*/
// Mengonfigurasi batas lag (misalnya, lebih dari 70ms dianggap sibuk)
toobusy.maxLag(70); 

// Middleware untuk menangani server yang sibuk
app.use((request, response, next) => {
	if (toobusy()) {
		// Log jika diperlukan
		console.warn('Server terlalu sibuk untuk memproses permintaan:', request.originalUrl);
		response.status(503).send("Server Too Busy");
	} else {
		next();
	}
});
/*------------------------------------------------------------------
[End Server Busy]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[404]
-------------------------------------------------------------------*/
app.all('*', (request, response) => {
	return response.status(404).json({
		error: "404 Detected - Resource Not Found"
	});
});
/*------------------------------------------------------------------
[End 404]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Error]
-------------------------------------------------------------------*/
app.use((error, request, response, next) => {
	if (response.headersSent) {
		return next(error);
	}

	console.error('Error Stack:', error.stack);
	logger.error(`Global error: ${error.message}`, { stack: error.stack });

	response.status(error.status || 500).json({
		error: "Internal Server Error",
		message: process.env.ENV_PRODUCTION === 'true' ? 'Something went wrong' : error.message,
	});
});
/*------------------------------------------------------------------
[End Error]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Process]
-------------------------------------------------------------------*/
const shutdown = (signal) => {
	console.log(`Received signal ${signal}. Shutting down gracefully...`);
	logger.info(`Received signal ${signal}. Shutting down gracefully...`);

	Promise.all([
	]).then(() => {
		console.log('Cleanup complete. Exiting...');
		logger.info('Cleanup complete. Exiting...');
		process.exit(0);
	})
	.catch((err) => {
		console.error('Error during cleanup:', err);
		logger.error('Error during cleanup:', err);
		process.exit(1);
	});
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Process events for unhandled errors
process.on('beforeExit', (code) => {
	console.log(`Process will exit with code: ${code}`);
	logger.info(`Process will exit with code: ${code}`);
});

process.on('exit', (code) => {
	console.log(`Process exited with code: ${code}`);
	logger.info(`Process exited with code: ${code}`);
});

process.on('unhandledRejection', (error) => {
	console.log('Unhandled Rejection:', error);
	logger.error('Unhandled Rejection:', { error });
	process.exit(1);
});

process.on('uncaughtException', (error) => {
	console.log('Uncaught Exception:', error);
	logger.error('Uncaught Exception:', { error });
	process.exit(1);
});
/*------------------------------------------------------------------
[End Process]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Mode]
-------------------------------------------------------------------*/
if (process.env.ENV_PRODUCTION == 'true') {
	console.log('------------------------------------------------------------------')
	console.log('APP PRODUCTION')
	console.log('------------------------------------------------------------------')
} else {
	console.log('------------------------------------------------------------------')
	console.log('APP DEVELOPMENT')
	console.log('------------------------------------------------------------------')
}
/*------------------------------------------------------------------
[End Mode]
-------------------------------------------------------------------*/

/*------------------------------------------------------------------
[Port]
-------------------------------------------------------------------*/
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(port_app, () => {
	console.log('------------------------------------------------------------------')
	console.log('APP PORT HTTP  :', port_app)
	console.log('------------------------------------------------------------------')
});

httpsServer.listen(port_app_ssl, () => {
	console.log('------------------------------------------------------------------')
	console.log('APP PORT HTTPS :', port_app_ssl)
	console.log('------------------------------------------------------------------')
});
/*------------------------------------------------------------------
[End Port]
-------------------------------------------------------------------*/