const express = require('express');
const router = express.Router();
const busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const { runQuery } = require('../../../../../config/dbc');
const { debug } = require('../../../../../config/debug');

const allowedMimeTypes = ['image/jpeg', 'image/png'];

router.put('/', async (request, response) => {
    try {
        const verify = request.verify;

        let formData = new Map();
        let bb = busboy({ headers: request.headers, immediate: true });

        const uploadDir = path.resolve('./public/upload');

        // Pastikan folder upload tersedia
        try {
            await fs.promises.mkdir(uploadDir, { recursive: true });
            console.log(`Directory ensured: ${uploadDir}`);
        } catch (err) {
            console.error('Error creating directory:', err);
            return response.status(500).json({ status: 1, message: 'Failed to create upload directory' });
        }

        let uploadedFile = null;

        bb.on('file', (name, file, info) => {
            const { filename, mimeType } = info;

            console.log(`File received: ${filename}, Type: ${mimeType}`);

            if (!allowedMimeTypes.includes(mimeType)) {
                console.log('Mime Type Denied:', mimeType);
                file.resume(); // Buang data file agar tidak membebani memory
                return;
            }

            // Cegah path traversal attack
            const safeFilename = `${path.basename(filename)}`;
            const saveTo = path.join(uploadDir, safeFilename);

            const writeStream = fs.createWriteStream(saveTo);
            file.pipe(writeStream);

            file.on('data', (data) => {
                console.log(`Received ${data.length} bytes for ${safeFilename}`);
            });

            file.on('end', () => {
                console.log(`Upload complete: ${safeFilename}`);
                uploadedFile = safeFilename;
            });

            file.on('error', (err) => {
                console.error(`Error writing file ${safeFilename}:`, err);
            });
        });

        bb.on('close', async () => {
            console.log('Form parsing complete');

            if (!uploadedFile) {
                return response.status(400).json({
                    "status": 102,
                    "message": "Format Image tidak sesuai",
                    "data": null
                });
            }

            try {
                // Ambil data user
                const [user] = await runQuery('SELECT profile_image FROM user WHERE email = ?', [verify.email]);

                if (!user) {
                    return response.status(404).json({ status: 1, message: 'User not found' });
                }

                // Hapus file lama jika ada
                if (user.profile_image) {
                    const oldFilePath = path.join(uploadDir, user.profile_image);
                    try {
                        await fs.promises.unlink(oldFilePath);
                        console.log(`Old profile image deleted: ${user.profile_image}`);
                    } catch (err) {
                        console.warn(`Failed to delete old image: ${user.profile_image}`, err);
                    }
                }

                // Update database dengan file baru
                const data = await runQuery('UPDATE user SET profile_image=? WHERE email=?', [uploadedFile, verify.email]);

                if (data.affectedRows > 0) {
                    console.log(`Profile updated successfully`);
                } else {
                    console.log(`Profile update failed`);
                }

                const server = process.env.ENV_PRODUCTION === 'true'
                    ? process.env.ENV_SERVER_PRODUCTION_BACKEND
                    : process.env.ENV_SERVER_DEV_BACKEND;

                response.status(200).json({
                    status: 0,
                    message: "Update Profile berhasil",
                    data: {
                        "email": "user@gmail.com",
                        "first_name": "User Edited",
                        "last_name": "Nutech Edited",
                        "profile_image": `${server}/${uploadedFile}`
                    }
                });
            } catch (err) {
                console.error('Database Error:', err);
                response.status(500).json({ status: 1, message: 'Failed to update profile' });
            }
        });

        bb.on('error', (err) => {
            console.error('Busboy Error:', err);
            response.status(500).json({ status: 1, message: 'File upload failed' });
        });

        request.pipe(bb);

    } catch (error) {
        response.status(400).json({
            error: debug(request.baseUrl, error)
        })
    }
});

module.exports = router;
