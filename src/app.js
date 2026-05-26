const express = require("express");

const cookieParser = require("cookie-parser")
 
const accountRouter=require("./routes/account.routes")

const authRouter=require("./routes/auth.routes")

const transactionRoutes=require("./routes/transaction.routes")

const cors = require("cors");





const app = express();


app.use(cors({
   origin: true,
   credentials: true
}));

app.use(express.json()) 
app.use(cookieParser()) 


app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transaction",transactionRoutes)



module.exports = app
