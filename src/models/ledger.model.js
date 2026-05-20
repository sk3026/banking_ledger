const mongoose=require("mongoose");
const transactionModel = require("./transaction.model");



const ledgerSchema=new mongoose.Schema({
    account:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Account is required"],
        index:true, //for fast searching
        immutable:true //ledger entries should not be modified after creation
    },
     amount:
     {
        type:Number,
        required:[true,"Amount is required"],
        min:[0.01,"Amount must be at least 0.01"],
        immutable:true //ledger entries should not be modified after creation
     }  
     ,
     transaction:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"transaction",
            required:[true,"Transaction is required"],
            index:true, //for fast searching
            immutable:true //ledger entries should not be modified after creation
        },
        type:
        {
            type:String,
            enum:
            {
                values:["debit","credit"],
                message:"Type must be either debit or credit"
            },
            required:[true,"Type is required"],
            immutable:true //ledger entries should not be modified after creation
        },

    })

   function preventLedgerModification() {
    throw new Error("Ledger entries cannot be modified after creation");
  }


  ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
  ledgerSchema.pre("updateOne", preventLedgerModification);
  ledgerSchema.pre("updateMany", preventLedgerModification);
  ledgerSchema.pre("update", preventLedgerModification);
  ledgerSchema.pre("deleteOne", preventLedgerModification);
  ledgerSchema.pre("deleteMany", preventLedgerModification);
  ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
  ledgerSchema.pre("findOneAndRemove", preventLedgerModification);
  ledgerSchema.pre("remove", preventLedgerModification);

  const ledgerModel=mongoose.model("ledger",ledgerSchema);

  module.exports=ledgerModel;



