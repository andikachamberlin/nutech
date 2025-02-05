const mysql = require('mysql2/promise');

const private_server =
	process.env.ENV_STAGING == 'true' ?
		process.env.ENV_STAGING_SERVER
		:
		process.env.ENV_PRODUCTION == 'true' ?
			process.env.ENV_PRODUCTION_SERVER
			:
			process.env.ENV_DEVELOPMENT_SERVER;

const private_user =
	process.env.ENV_STAGING == 'true' ?
		process.env.ENV_STAGING_USER
		:
		process.env.ENV_PRODUCTION == 'true' ?
			process.env.ENV_PRODUCTION_USER
			:
			process.env.ENV_DEVELOPMENT_USER;
const private_password =
	process.env.ENV_STAGING == 'true' ?
		process.env.ENV_STAGING_PASSWORD
		:
		process.env.ENV_PRODUCTION == 'true' ?
			process.env.ENV_PRODUCTION_PASSWORD
			:
			process.env.ENV_DEVELOPMENT_PASSWORD;
const private_database =
	process.env.ENV_STAGING == 'true' ?
		process.env.ENV_STAGING_DATABASE
		:
		process.env.ENV_PRODUCTION == 'true' ?
			process.env.ENV_PRODUCTION_DATABASE
			:
			process.env.ENV_DEVELOPMENT_DATABASE;

const private_port =
	process.env.ENV_STAGING == 'true' ?
		process.env.ENV_STAGING_PORT
		:
		process.env.ENV_PRODUCTION == 'true' ?
			process.env.ENV_PRODUCTION_PORT
			:
			process.env.ENV_DEVELOPMENT_PORT;

const dbc = mysql.createPool({
	connectionLimit: 100,           // Maksimum koneksi dalam pool
	connectTimeout: 30000,          // Waktu maksimum untuk mencoba menghubungkan (30 detik)
	queueLimit: 0,                  // Tidak ada batasan untuk antrean koneksi
	waitForConnections: true,       // Tunggu koneksi jika tidak ada yang tersedia
	host: private_server,
	user: private_user,
	password: private_password,
	database: private_database,
	port: private_port,
	multipleStatements: false       // Matikan multipleStatements untuk meningkatkan keamanan
});

async function checkConnection() {
	try {
		const connection = await dbc.getConnection();

		console.log('------------------------------------------------------------------')
		console.log('DATABASE MYSQL CONNECTED')
		console.log('------------------------------------------------------------------')

		connection.release();
	} catch (err) {
		console.log('------------------------------------------------------------------')
		console.log('DATABASE MYSQL NOT CONNECTED')
		console.log('------------------------------------------------------------------')
		console.log(err);
	}
}

checkConnection()

async function runQuery(query, params = [], useTransaction = false) {
    let connection;

    try {
        // Ambil koneksi dari pool
        connection = await dbc.getConnection();

        // Jika menggunakan transaksi, mulai transaksi
        if (useTransaction) {
            await connection.beginTransaction();
        }

        // Eksekusi query dengan parameter
        const [results] = await connection.execute(query, params);

        // Commit jika menggunakan transaksi
        if (useTransaction) {
            await connection.commit();
        }

        return results;
    } catch (err) {
        console.error('------------------------------------------------------------------');
        console.error('MYSQL2 Error executing query:');
        console.error('Query:', query);
        console.error('Params:', JSON.stringify(params)); // Hindari log jika params sensitif
        console.error('Error:', err.message || err);
        console.error('------------------------------------------------------------------');

        // Rollback jika menggunakan transaksi
        if (useTransaction && connection) {
            try {
                await connection.rollback();
                console.error('Transaction rolled back successfully.');
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }

        // Lempar error untuk ditangani oleh caller
        throw err;
    } finally {
        // Lepas koneksi hanya jika sudah berhasil diambil
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
}

// Contoh penggunaan normal
// (async () => {
//     try {
//         const results = await runQuery('SELECT * FROM your_table WHERE id = ?', [1]);
//         console.log(results);
//     } catch (error) {
//         console.error('Error executing query:', error);
//     }
// })();

// contoh penggunakan rollback
// (async () => {
//     try {
//         const result1 = await runQuery('INSERT INTO users (name, email) VALUES (?, ?)', ['John Doe', 'john@example.com'], true);
//         const result2 = await runQuery('INSERT INTO orders (user_id, total) VALUES (?, ?)', [result1.insertId, 100], true);
//         console.log('Transaction committed successfully');
//     } catch (error) {
//         console.error('Transaction failed:', error.message);
//     }
// })();

module.exports = {
	runQuery
};