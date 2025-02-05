const jwt = require("jsonwebtoken");

const verify = async (request, response, next) => {
    const bearer_header = request.headers["authorization"];

    if (typeof bearer_header === "undefined") { return response.status(400).json({ error: "Authorization Denied" }) }

    const token = bearer_header.split(" ")[1];

    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.ENV_TOKEN_KEY, (error, decoded) => {
                if (error) reject(error);
                else resolve(decoded);
            });
        });

        request.verify = decoded;
        next();
    } catch (error) {
        return response.status(401).json(
            {
                "status": 108,
                "message": "Token tidak tidak valid atau kadaluwarsa",
                "data": null
            }
        );
    }
}

module.exports = {
    verify
};
