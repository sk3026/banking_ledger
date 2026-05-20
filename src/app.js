const express = require("express");

const cookieParser = require("cookie-parser")
 
const accountRouter=require("./routes/account.routes")

const authRouter=require("./routes/auth.routes")

const transactionRoutes=require("./routes/transaction.routes")



const app = express();

app.use(express.json()) //allow express to read data form request body
app.use(cookieParser()) 


app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transaction",transactionRoutes)



module.exports = app
