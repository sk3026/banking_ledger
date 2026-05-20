const {Router}=require("express")

const authMiddleware=require("../middleware/auth.middleware")

const transactionController=require("../controllers/transaction.controller")




const transactionRoutes=Router();



/**
 * - POST /api/transactions/
 *- Create a new transaction for logged in user
 *- Protected Route
 * 
 * 
 */

 transactionRoutes.post("/",authMiddleware.authMiddleware, transactionController.createTransaction);

 /**
  * Post /api/transactions/sytem/initial-funds
  * -create initial funds for system user
  */

 transactionRoutes.post("/system/initial-funds",authMiddleware.authsystemUserMiddleware,transactionController.createInitialFunds);

 module.exports=transactionRoutes;
