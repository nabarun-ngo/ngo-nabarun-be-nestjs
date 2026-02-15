# Payment Gateway Integration Plan

This document outlines the changes needed to integrate a payment gateway (e.g. Razorpay, Stripe, PayU) into the NestJS backend, while keeping the existing manual payment flow (CASH, NETBANKING, UPI confirmation) intact.

**Foundation already in place:** The `Payment` module, `PaymentTransaction` table, gateway abstraction (`IPaymentGateway`), and stub adapter are implemented. When you choose a gateway, you only need to **implement one adapter class** and **register it** – see `src/modules/payment/README.md` for the exact steps.

---

## 1. Current State Summary

| Area | Current behavior |
|------|------------------|
| **Donations** | Created with status `RAISED`; payment is recorded manually via `ProcessDonationPaymentUseCase` (confirm payment received → post to ledger → mark PAID). |
| **Payment methods** | `CASH`, `NETBANKING`, `UPI` (stored on `Donation.paymentMethod`). No online gateway flow yet. |
| **Ledger** | `PostToLedgerUseCase` posts journal entry when donation is marked paid; `Donation.transactionRef` stores journal entry id. |
| **Expenses** | Similar manual flow (create → submit → finalize → settle); no online payment. |

**Goal:** Add an optional **online payment** path: user initiates payment → gateway → success/failure webhook → auto-update donation + post to ledger, without breaking existing manual confirmation.

---

## 2. High-Level Architecture

```
[Client] → Create Donation (RAISED)
        → "Pay online" → Backend creates gateway order → returns order_id / checkout URL
        → User pays on gateway
        → Gateway sends webhook (payment.captured / payment.failed)
        → Backend: verify webhook → update Donation (PAID/PAYMENT_FAILED) → PostToLedger if PAID
```

- **Manual flow** stays as-is: admin still can call “process payment” with account, method, date.
- **Online flow** is additive: new “create order” endpoint + webhook handler + new persistence for payment attempts.

---

## 3. Database (Prisma) Changes

### 3.1 New model: `PaymentTransaction` (or `PaymentIntent`)

Stores each gateway payment attempt and links to Donation (and later Expense if needed).

```prisma
// Suggested addition to prisma/schema.prisma

model PaymentTransaction {
  id                String    @id @default(uuid())
  gateway           String    @db.VarChar(30)   // RAZORPAY, STRIPE, PAYU
  gatewayOrderId    String?   @unique @db.VarChar(100)  // gateway's order_id
  gatewayPaymentId  String?   @db.VarChar(100)          // gateway's payment_id (after capture)
  status            String    @db.VarChar(30)   // CREATED, ATTEMPTED, CAPTURED, FAILED, REFUNDED, CANCELLED
  amount            Decimal   @db.Decimal(12, 2)
  currency          String    @db.VarChar(3)
  receiptPrefix     String?   @db.VarChar(50)   // optional receipt id for gateway

  // What this payment is for
  referenceType     String    @db.VarChar(30)   // DONATION, EXPENSE
  referenceId       String    @db.VarChar(255)  // donation id or expense id

  // Gateway response / metadata (for debugging and idempotency)
  gatewayPayload    Json?     // raw create-order response
  failureReason     String?   @db.Text
  idempotencyKey    String?   @unique @db.VarChar(100)  // prevent duplicate webhook processing

  createdAt         DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  capturedAt       DateTime?

  @@index([referenceType, referenceId])
  @@index([gatewayOrderId])
  @@index([gatewayPaymentId])
  @@index([idempotencyKey])
  @@map("payment_transactions")
}
```

### 3.2 Donation model – optional link to payment transaction

- Add optional field to link a donation to its online payment (e.g. for “pay online” flow only):

```prisma
// In model Donation, add:
paymentTransactionId  String?  @db.VarChar(255)
// And relation if you add PaymentTransaction above:
// paymentTransaction  PaymentTransaction? @relation(...)
```

- **Alternative:** You can resolve “donation for this payment” only via `PaymentTransaction.referenceType = 'DONATION'` and `referenceId = donation.id`, and skip a direct FK on Donation. Either way is fine; FK makes queries easier.

### 3.3 Migration

- Add the new table (and optional Donation column) via Prisma migration when you start implementation.

---

## 4. New Module / Folder Structure

Suggested place: **Payment** as a separate feature module that the Finance module uses for “create order” and “handle webhook”.

```
src/modules/
  payment/                          # NEW
    payment.module.ts
    domain/
      model/
        payment-transaction.model.ts
      repositories/
        payment-transaction.repository.interface.ts
      ports/
        payment-gateway.interface.ts   # abstraction for any gateway
    application/
      use-cases/
        create-payment-order.use-case.ts   # create order for a donation
        handle-payment-webhook.use-case.ts # verify + update donation + ledger
      dto/
        create-order.dto.ts
        webhook-payload.dto.ts
    infrastructure/
      persistence/
        payment-transaction.repository.ts
      gateways/
        razorpay.gateway.ts              # implements payment-gateway.interface
        stripe.gateway.ts                # optional, same interface
    presentation/
      controllers/
        payment.controller.ts            # create order (auth)
        payment-webhook.controller.ts    # webhook (no JWT; verify signature)
```

- **Finance module** continues to own Donation/Expense and `ProcessDonationPaymentUseCase`; it will call Payment module’s “create order” and the webhook use case will call Finance’s “mark paid + post to ledger” (or a dedicated use case that does both).

---

## 5. Payment Gateway Abstraction

Define a port so you can swap providers (Razorpay today, Stripe/PayU later) without changing business logic.

```ts
// payment-gateway.interface.ts (conceptual)

export interface CreateOrderParams {
  amount: number;           // in smallest currency unit if needed (e.g. paise)
  currency: string;
  receipt: string;          // your unique id (e.g. donation id or payment_transaction id)
  referenceType: string;    // DONATION
  referenceId: string;      // donation id
  customer?: { email?: string; name?: string; phone?: string };
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  shortUrl?: string;        // checkout link if gateway provides
  gatewayPayload?: object;
}

export interface IPaymentGateway {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookPayload(payload: unknown): WebhookPayload;  // normalized success/failure
}
```

- **Razorpay**: `orders.create`, then return `order.id` and optionally a Payment Link or redirect URL.
- **Stripe**: Checkout Session or PaymentIntent; return `session.id` / `client_secret` and URL.
- Webhook handler receives raw body, verifies signature using gateway adapter, then calls `HandlePaymentWebhookUseCase`.

---

## 6. Configuration & Environment

- Add env vars (and validate in `app.config` or a dedicated config namespace):

```env
# Payment (example Razorpay)
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
PAYMENT_RETURN_URL=https://yourapp.com/donation/success
PAYMENT_CANCEL_URL=https://yourapp.com/donation/cancel
```

- Use `PAYMENT_GATEWAY` to choose which adapter to inject. Keep keys and webhook secret out of code; use `ConfigService`.

---

## 7. Key Flows

### 7.1 Create payment order (for donation)

- **Endpoint:** e.g. `POST /api/payment/order` or `POST /api/donation/:id/create-order`.
- **Auth:** Required (user or admin creating “pay online” for a donation).
- **Steps:**
  1. Load donation by id; ensure status is RAISED/PENDING/PAY_LATER and amount > 0.
  2. Optionally create a `PaymentTransaction` with status `CREATED`, referenceType `DONATION`, referenceId = donation.id, idempotencyKey = f(donationId + timestamp or random).
  3. Call gateway adapter `createOrder({ amount, currency, receipt, referenceType, referenceId, customer, returnUrl, cancelUrl })`.
  4. Save `gatewayOrderId` (and any `shortUrl`) on `PaymentTransaction`; return orderId and URL to client.
- **Idempotency:** If client retries, you can either reuse same order (if gateway allows) or create a new transaction with a new idempotency key; avoid creating duplicate orders for the same donation in the same time window.

### 7.2 Webhook (payment captured / failed)

- **Endpoint:** `POST /api/payment/webhook/razorpay` (no JWT).
- **Steps:**
  1. Read raw body (for signature verification).
  2. Verify signature using `RAZORPAY_WEBHOOK_SECRET` (or equivalent for other gateways).
  3. Parse event (e.g. `payment.captured`, `payment.failed`).
  4. Extract `order_id` / `payment_id`; load or create `PaymentTransaction` by `gatewayOrderId`.
  5. **Idempotency:** If `PaymentTransaction` already has status `CAPTURED`/`FAILED` and you have a webhook idempotency key, return 200 without re-applying.
  6. If **captured:**
     - Load donation by `referenceId` (and optionally double-check referenceType).
     - Call existing `ProcessDonationPaymentUseCase` with: donationId, accountId (config or from donation/account selection rule), paymentMethod = UPI/NETBANKING (or a new enum value like `ONLINE`), paidOn = now, and optionally pass gateway payment_id in remarks or a new field.
     - Or introduce a small “confirm donation payment from gateway” use case that: marks donation PAID, sets paidToAccountId (from config/default), paymentMethod, then calls `PostToLedgerUseCase` and links transactionRef. This keeps webhook handler thin.
  7. If **failed:** Update donation to `PAYMENT_FAILED`, set `paymentFailureDetail` from gateway reason; optionally update `PaymentTransaction.status = FAILED` and `failureReason`.
  8. Return 200 quickly so gateway stops retrying; do heavy work (emails, etc.) in a job if needed.

### 7.3 Manual payment (unchanged)

- Existing `ProcessDonationPaymentUseCase` and donation “process payment” endpoint stay as they are; used when payment is received offline (CASH, bank transfer, UPI confirmed manually).

---

## 8. Finance Module Changes (Minimal)

- **Donation:**
  - Add optional `paymentTransactionId` (or rely only on `PaymentTransaction.referenceId`).
  - Optionally add `PaymentMethod.ONLINE` or keep using `UPI`/`NETBANKING` for gateway payments.
- **ProcessDonationPaymentUseCase:**
  - Either allow a “gateway payment” path that passes a flag or gateway payment id (for audit), or keep it as-is and have the webhook use case call it with the same DTO (accountId might come from config for “default donation account”).
- **Expense:** No change initially; later you can add “pay online” for expense reimbursement using the same `PaymentTransaction` + referenceType `EXPENSE` and a similar webhook flow.

---

## 9. Security Checklist

- Webhook endpoint: **verify signature** using gateway’s secret; reject if invalid.
- **Idempotency:** Use `gatewayPaymentId` or webhook event id as idempotency key so duplicate webhooks don’t double-post to ledger.
- **No sensitive data in logs:** Don’t log full card/UPI details; log only order_id, payment_id, referenceId.
- **HTTPS only** for return and webhook URLs.
- Prefer **webhook** for final state; don’t rely only on redirect (user might close browser).

---

## 10. Testing Strategy

- **Unit:** Gateway adapter mock; create-order and webhook use cases with in-memory repo.
- **Integration:** Use gateway test keys and test webhooks (Razorpay/Stripe provide test mode and webhook testing tools).
- **E2E:** Create donation → create order → simulate webhook (or test card) → assert donation PAID and ledger entry created.

---

## 11. Suggested Implementation Order

| Phase | Task |
|-------|------|
| 1 | Add `PaymentTransaction` (and optional Donation link) in Prisma; run migration. |
| 2 | Add config for payment gateway (env + config module). |
| 3 | Implement `IPaymentGateway` and Razorpay adapter (createOrder + verifyWebhook + parse). |
| 4 | Implement `CreatePaymentOrderUseCase` and `HandlePaymentWebhookUseCase`. |
| 5 | Add `PaymentController` (create order) and `PaymentWebhookController` (webhook). |
| 6 | Wire PaymentModule; from Finance or Payment controller call create order for donation. |
| 7 | In webhook handler: on success, call existing donation “mark paid” + ledger flow; on failure, set PAYMENT_FAILED. |
| 8 | Add idempotency and logging; tests. |
| 9 | (Later) Expense “pay online” and/or recurring (subscription) if needed. |

---

## 12. Optional: Recurring Donations (REGULAR)

If you want **automated recurring charges** for `DonationType.REGULAR`:

- Use gateway’s subscription/tokenization APIs (Razorpay Subscriptions, Stripe Subscriptions).
- Add tables like `PaymentMethodToken` (customer tokenized method) and `RecurringSchedule` linked to donation.
- A cron job (you already have CronModule) can “raise” the monthly donation and trigger gateway charge using stored token; webhook again updates donation and ledger.

This can be a separate phase after one-time payment is stable.

---

## Summary

- **Database:** New `PaymentTransaction` (and optional Donation FK); keep existing Donation/Expense/Account/Ledger as-is.
- **New module:** Payment (create order + webhook); Finance keeps donation/ledger logic.
- **Abstraction:** Gateway interface + Razorpay (or Stripe) implementation.
- **Flows:** Create order for donation → user pays → webhook → update donation + post to ledger; manual flow unchanged.
- **Config & security:** Env-based keys, webhook secret verification, idempotency, no sensitive logging.

When you’re ready to implement, start with Phase 1 (schema + migration) and Phase 2 (config), then add the gateway adapter and the two use cases.
