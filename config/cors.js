
const cors_development = [
    // client
    "http://localhost:3000",
    "http://localhost:3300",
    "http://localhost:3400",
    // api
    "http://localhost:5500",
    // socket
    "http://localhost:4000",
    // flask
    "http://localhost:5600",
    // go
    "http://localhost:5700",
    // webhook
    "http://localhost:5800",
    // ngrok server
    "https://313c-36-71-139-1.ngrok-free.app",
    // ngrok client
    "https://126d-36-71-139-1.ngrok-free.app"
]
const cors_production = [
    // api
    "https://nutech.pintagram.id",
]

module.exports = {
    cors_development,
    cors_production
};
