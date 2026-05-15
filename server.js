require("dotenv").config() //imp 
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

console.log("MONGO_URI:", process.env.MONGO_URI) 

const app = require("./src/app")
const connectToDB = require("./src/config/db")

connectToDB()
app.listen(3000, () => {
    console.log("Server is running on port 3000")
})