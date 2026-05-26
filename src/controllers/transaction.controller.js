const transactionModel = require("../models/transaction.model");

const ledgerModel = require("../models/ledger.model");

const accountModel = require("../models/accounts.model");

const mongoose = require("mongoose");

const emailService = require("../services/email.service");

/**
 * ---------------------------------------------------
 * CREATE NORMAL TRANSACTION
 * ---------------------------------------------------
 */

async function createTransaction(req, res) {

    const session =
        await mongoose.startSession();

    try {

        console.log(
            "===== CREATE TRANSACTION ====="
        );

        console.log(
            "REQUEST BODY:",
            req.body
        );

        console.log(
            "LOGGED IN USER:",
            req.user
        );

        session.startTransaction();

        const {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        /**
         * ---------------------------------------------------
         * VALIDATION
         * ---------------------------------------------------
         */

        if (
            !fromAccount ||
            !toAccount ||
            !amount ||
            !idempotencyKey
        ) {

            return res.status(400).json({
                message:
                    "All fields are required",
                status: "failed"
            });
        }

        /**
         * Validate ObjectIds
         */

        if (
            !mongoose.Types.ObjectId.isValid(
                fromAccount
            ) ||

            !mongoose.Types.ObjectId.isValid(
                toAccount
            )
        ) {

            return res.status(400).json({
                message:
                    "Invalid account id",
                status: "failed"
            });
        }

        /**
         * Validate amount
         */

        if (amount <= 0) {

            return res.status(400).json({
                message:
                    "Amount must be greater than 0",
                status: "failed"
            });
        }

        /**
         * Prevent self transfer
         */

        if (fromAccount === toAccount) {

            return res.status(400).json({
                message:
                    "Cannot transfer to same account",
                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * FIND ACCOUNTS
         * ---------------------------------------------------
         */

        const fromUserAccount =
            await accountModel.findById(
                fromAccount
            ).session(session);

        const toUserAccount =
            await accountModel.findById(
                toAccount
            ).session(session);

        console.log(
            "FROM ACCOUNT:",
            fromUserAccount
        );

        console.log(
            "TO ACCOUNT:",
            toUserAccount
        );

        if (
            !fromUserAccount ||
            !toUserAccount
        ) {

            return res.status(404).json({
                message:
                    "One or both accounts not found",
                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * SECURITY CHECK
         * ---------------------------------------------------
         * User can only send from own account
         */

        if (
            fromUserAccount.user.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                message:
                    "Unauthorized account access",
                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * ACCOUNT STATUS CHECK
         * ---------------------------------------------------
         */

        if (
            fromUserAccount.status !==
            "active" ||

            toUserAccount.status !==
            "active"
        ) {

            return res.status(400).json({
                message:
                    "One or both accounts are inactive",

                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * IDEMPOTENCY CHECK
         * ---------------------------------------------------
         */

        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            }).session(session);

        if (existingTransaction) {

            console.log(
                "EXISTING TRANSACTION:",
                existingTransaction
            );

            if (
                existingTransaction.status ===
                "completed"
            ) {

                return res.status(200).json({
                    message:
                        "Transaction already processed",

                    status: "success",

                    data: existingTransaction
                });
            }

            if (
                existingTransaction.status ===
                "pending"
            ) {

                return res.status(200).json({
                    message:
                        "Transaction pending",

                    status: "pending"
                });
            }

            return res.status(400).json({
                message:
                    "Previous transaction failed/reversed",

                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * CHECK BALANCE
         * ---------------------------------------------------
         */

        const balance =
            await fromUserAccount.getBalance();

        console.log(
            "CURRENT BALANCE:",
            balance
        );

        if (balance < amount) {

            return res.status(400).json({
                message:
                    `Insufficient balance. Current balance is ${balance}`,

                status: "failed"
            });
        }

        /**
         * ---------------------------------------------------
         * CREATE TRANSACTION
         * ---------------------------------------------------
         */

        const transaction =
            await transactionModel.create([{

                fromAccount,

                toAccount,

                amount,

                idempotencyKey,

                status: "pending"

            }], { session });

        const createdTransaction =
            transaction[0];

        console.log(
            "TRANSACTION CREATED:",
            createdTransaction
        );

        /**
         * ---------------------------------------------------
         * DEBIT ENTRY
         * ---------------------------------------------------
         */

        const debitEntry =
            await ledgerModel.create([{

                account: fromAccount,

                amount,

                transaction:
                    createdTransaction._id,

                type: "debit"

            }], { session });

        console.log(
            "DEBIT ENTRY:",
            debitEntry
        );

        /**
         * ---------------------------------------------------
         * CREDIT ENTRY
         * ---------------------------------------------------
         */

        const creditEntry =
            await ledgerModel.create([{

                account: toAccount,

                amount,

                transaction:
                    createdTransaction._id,

                type: "credit"

            }], { session });

        console.log(
            "CREDIT ENTRY:",
            creditEntry
        );

        /**
         * ---------------------------------------------------
         * COMPLETE TRANSACTION
         * ---------------------------------------------------
         */

        createdTransaction.status =
            "completed";

        await createdTransaction.save({
            session
        });

        console.log(
            "TRANSACTION COMPLETED"
        );

        /**
         * ---------------------------------------------------
         * COMMIT TRANSACTION
         * ---------------------------------------------------
         */

        await session.commitTransaction();

        console.log(
            "TRANSACTION COMMITTED"
        );

        /**
         * ---------------------------------------------------
         * SEND EMAIL
         * ---------------------------------------------------
         */

        try {

            await emailService
                .sendTransactionEmail(

                req.user.email,

                req.user.name,

                amount,

                fromAccount,

                toAccount
            );

            console.log(
                "EMAIL SENT SUCCESSFULLY"
            );

        } catch (emailError) {

            console.log(
                "EMAIL ERROR:",
                emailError.message
            );
        }

        return res.status(200).json({

            message:
                "Transaction successful",

            status: "success",

            data: createdTransaction
        });

    } catch (error) {

        console.log(
            "TRANSACTION ERROR:",
            error
        );

        if (session.inTransaction()) {

            await session.abortTransaction();

            console.log(
                "TRANSACTION ABORTED"
            );
        }

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });

    } finally {

        session.endSession();

        console.log("SESSION ENDED");
    }
}

/**
 * ---------------------------------------------------
 * CREATE INITIAL FUNDS
 * ---------------------------------------------------
 */

async function createInitialFunds(
    req,
    res
) {

    const session =
        await mongoose.startSession();

    try {

        console.log(
            "===== INITIAL FUNDS ====="
        );

        session.startTransaction();

        const {
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        /**
         * Validate request
         */

        if (
            !toAccount ||
            !amount ||
            !idempotencyKey
        ) {

            return res.status(400).json({
                message:
                    "All fields are required",
                status: "failed"
            });
        }

        /**
         * Validate amount
         */

        if (amount <= 0) {

            return res.status(400).json({
                message:
                    "Amount must be greater than 0",
                status: "failed"
            });
        }

        /**
         * Find receiver account
         */

        const toUserAccount =
            await accountModel.findById(
                toAccount
            ).session(session);

        if (!toUserAccount) {

            return res.status(404).json({
                message:
                    "Account not found",
                status: "failed"
            });
        }

        /**
         * Find system account
         */

        const systemAccount =
            await accountModel.findOne({
                user: req.user._id
            }).session(session);

        if (!systemAccount) {

            return res.status(404).json({
                message:
                    "System account not found",
                status: "failed"
            });
        }

        /**
         * Check idempotency
         */

        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            }).session(session);

        if (existingTransaction) {

            return res.status(200).json({
                message:
                    "Transaction already processed",

                status: "success",

                data: existingTransaction
            });
        }

        /**
         * Create transaction
         */

        const transaction =
            await transactionModel.create([{

                fromAccount:
                    systemAccount._id,

                toAccount,

                amount,

                idempotencyKey,

                status: "pending"

            }], { session });

        const createdTransaction =
            transaction[0];

        /**
         * Debit system account
         */

        await ledgerModel.create([{

            account:
                systemAccount._id,

            amount,

            transaction:
                createdTransaction._id,

            type: "debit"

        }], { session });

        /**
         * Credit receiver account
         */

        await ledgerModel.create([{

            account: toAccount,

            amount,

            transaction:
                createdTransaction._id,

            type: "credit"

        }], { session });

        /**
         * Complete transaction
         */

        createdTransaction.status =
            "completed";

        await createdTransaction.save({
            session
        });

        /**
         * Commit transaction
         */

        await session.commitTransaction();

        return res.status(201).json({

            message:
                "Initial funds added successfully",

            status: "success",

            data: createdTransaction
        });

    } catch (error) {

        console.log(
            "INITIAL FUND ERROR:",
            error
        );

        if (session.inTransaction()) {

            await session.abortTransaction();
        }

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });

    } finally {

        session.endSession();
    }
}

module.exports = {
    createTransaction,
    createInitialFunds
};