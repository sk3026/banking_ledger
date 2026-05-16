const express=require("express");

const router=express.Router();
const authController=require("../controllers/auth.controllers")



router.post("/register",authController.userRegistrationController)

router.post("/login",authController.userLoginController)






module.exports=router