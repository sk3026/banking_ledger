# Banking Ledger Transaction System

A REST API for transferring funds between accounts with double-entry bookkeeping and idempotent transaction processing.

---

## Stack

Node.js · Express v5 · MongoDB (Mongoose) · JWT · Nodemailer

---

## Setup

```bash
git clone https://github.com/sk3026/banking_ledger.git
cd banking_ledger
npm install
```

Create a `.env` file:

```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_SERVICE=your_email_config
```

```bash
npm run dev    # development
npm start      # production
```

---

## API

### Auth
```
POST /api/auth/register
POST /api/auth/login
```

### Accounts
```
GET    /api/accounts/
POST   /api/accounts/
GET    /api/accounts/:id
PUT    /api/accounts/:id
DELETE /api/accounts/:id
```

### Transactions
```
POST /api/transaction/                      Create transaction       [JWT required]
POST /api/transaction/system/initial-funds  Seed account funds       [System only]
```

---

## How Transactions Work

Every transaction runs inside a **MongoDB session**, meaning all steps either complete together or roll back entirely — no partial state is ever saved.

The steps, in order:

1. Validate inputs and account ownership
2. Check the idempotency key (explained below)
3. Verify the sender has sufficient balance
4. Create the transaction record with status `pending`
5. Write a debit ledger entry for the sender
6. Write a credit ledger entry for the receiver
7. Mark the transaction `completed` and commit
8. Send an email notification (failure here does not affect the transaction)

---

## Idempotency

The transaction endpoints require an `idempotencyKey` in every request. This is a client-generated unique identifier (e.g. a UUID) that represents a single transfer intent.

**Why it matters:** If a request times out or the client retries due to a network error, sending the same `idempotencyKey` again will not create a duplicate transaction. The server looks up the key and returns the original result instead of processing it twice.

**What happens based on the existing transaction's status:**

| Status | What it means | Response |
|---|---|---|
| `completed` | Already processed successfully | Returns the original transaction |
| `pending` | Still being processed | Returns a pending status — wait and retry |
| `failed` / `reversed` | Did not complete | Returns an error — use a new key to retry |
| _(not found)_ | First time seeing this key | Processes the transaction normally |

**Example request body:**

```json
{
  "fromAccount": "64abc123...",
  "toAccount": "64def456...",
  "amount": 500,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

> Generate a fresh UUID for each new transfer. Never reuse a key for a different transaction — you will get back the original result.

---

## Double-Entry Ledger

Every transfer creates two ledger entries: a **debit** from the sender and a **credit** to the receiver. The two entries always reference the same transaction ID, keeping the books balanced and providing a full audit trail.

---

## Project Structure

```
src/
├── config/         # Database connection
├── models/         # User, Account, Transaction, Ledger schemas
├── routes/         # Route definitions
├── controllers/    # Business logic
├── middleware/     # JWT auth guard
└── services/       # Email notifications
```

---

## Known Gaps

- No test suite
- No rate limiting
- No pagination
- No API documentation (Swagger)
- No structured logging
