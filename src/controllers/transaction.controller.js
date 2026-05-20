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

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey
        } = req.body;

        /**
         * Validate request
         */

        if (
            !fromAccount ||
            !toAccount ||
            !amount ||
            !idempotencyKey
        ) {
            return res.status(400).json({
                message: "All fields are required",
                status: "failed"
            });
        }

        /**
         * Validate ObjectIds
         */

        if (
            !mongoose.Types.ObjectId.isValid(fromAccount) ||
            !mongoose.Types.ObjectId.isValid(toAccount)
        ) {
            return res.status(400).json({
                message: "Invalid account id",
                status: "failed"
            });
        }

        /**
         * Validate amount
         */

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0",
                status: "failed"
            });
        }

        /**
         * Prevent self transfer
         */

        if (fromAccount === toAccount) {
            return res.status(400).json({
                message: "Cannot transfer to same account",
                status: "failed"
            });
        }

        /**
         * Find accounts
         */

        const fromUserAccount = await accountModel
            .findById(fromAccount)
            .session(session);

        const toUserAccount = await accountModel
            .findById(toAccount)
            .session(session);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(404).json({
                message: "One or both accounts not found",
                status: "failed"
            });
        }

        /**
         * Check account status
         */

        if (
            fromUserAccount.status !== "active" ||
            toUserAccount.status !== "active"
        ) {
            return res.status(400).json({
                message: "One or both accounts are inactive",
                status: "failed"
            });
        }

        /**
         * Idempotency check
         */

        const existingTransaction =
            await transactionModel.findOne({
                idempotencyKey
            }).session(session);

        if (existingTransaction) {

            if (
                existingTransaction.status === "completed"
            ) {
                return res.status(200).json({
                    message:
                        "Transaction already processed",
                    status: "success",
                    data: existingTransaction
                });
            }

            if (
                existingTransaction.status === "pending"
            ) {
                return res.status(200).json({
                    message: "Transaction pending",
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
         * Check balance
         */

        const balance =
            await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message:
                    `Insufficient balance. Current balance is ${balance}`,
                status: "failed"
            });
        }

        /**
         * Create transaction
         */

        const transaction =
            await transactionModel.create([{
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status: "pending"
            }], { session });

        const createdTransaction = transaction[0];

        /**
         * Debit ledger
         */

        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: createdTransaction._id,
            type: "debit"
        }], { session });

        /**
         * Credit ledger
         */

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: createdTransaction._id,
            type: "credit"
        }], { session });

        /**
         * Complete transaction
         */

        createdTransaction.status = "completed";

        await createdTransaction.save({
            session
        });

        /**
         * Commit transaction
         */

        await session.commitTransaction();

        /**
         * Send email
         */

        try {

            await emailService.sendTransactionEmail(
                req.user.email,
                req.user.name,
                amount,
                fromAccount,
                toAccount
            );

        } catch (emailError) {

            console.log(
                "Email failed:",
                emailError.message
            );
        }

        return res.status(200).json({
            message: "Transaction successful",
            status: "success",
            data: createdTransaction
        });

    } catch (error) {

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

/**
 * ---------------------------------------------------
 * CREATE INITIAL FUNDS
 * ---------------------------------------------------
 */

async function createInitialFunds(req, res) {

    const session = await mongoose.startSession();

    try {

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
                message: "All fields are required",
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
                message: "Account not found",
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
                fromAccount: systemAccount._id,
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
            account: systemAccount._id,
            amount,
            transaction:
                createdTransaction._id,
            type: "debit"
        }], { session });

        /**
         * Credit user account
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