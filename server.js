require("dotenv").config()
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = require("./src/app")
const connectToDB = require("./src/config/db")

const PORT = process.env.PORT || 3000;

connectToDB()
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})