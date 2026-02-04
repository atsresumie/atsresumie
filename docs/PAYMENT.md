# ATSResumie Payment System Documentation

> Phase 9 Implementation: Stripe Monthly Subscription

---

## Overview

ATSResumie uses Stripe Checkout for secure monthly subscriptions. Users subscribe to get credits each month. This document covers the architecture, security model, and implementation details.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Checkout   │────▶│   Stripe    │
│   Credits   │     │    API       │     │  Checkout   │
│    Page     │     │ /api/stripe  │     │   Session   │
└─────────────┘     │   /checkout  │     └─────────────┘
                    └──────────────┘            │
                                                │ (payment)
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Database   │◀────│   Webhook    │◀────│   Stripe    │
│  Credits    │     │    API       │     │   Webhook   │
│  Updated    │     │ /api/stripe  │     │   Event     │
└─────────────┘     │   /webhook   │     └─────────────┘
```

## Subscription Plans

| Pack ID  | Label | Credits/Month | Price (CAD) |
| -------- | ----- | ------------- | ----------- |
| `pro_75` | Pro   | 75            | $10/month   |

### Configuration

Credit packs are defined server-side in `lib/stripe/config.ts`:

```typescript
export const CREDIT_PACKS = {
	pro_75: {
		packId: "pro_75",
		label: "Pro Pack",
		credits: 75,
		priceCents: 1000,
		currency: "cad",
		stripePriceId: process.env.STRIPE_PRICE_PRO_75,
	},
};
```

**Adding new packs:**

1. Create a Price in Stripe Dashboard
2. Add the pack to `CREDIT_PACKS` in `lib/stripe/config.ts`
3. Add the environment variable for the Stripe Price ID

---

## Security Model

### Client Never Controls Pricing

1. Client sends only `packId` (e.g., "pro_75")
2. Server validates `packId` against known packs
3. Server uses its own Stripe Price ID (from env)
4. Credits amount is derived from server config after webhook validates price

### Server-Authoritative Price Validation

In the webhook handler:

1. Retrieve Checkout Session with expanded line items
2. Validate exactly 1 line item exists
3. Validate line item's `price.id` matches our `STRIPE_PRICE_PRO_75`
4. Derive credits amount from server config (not metadata)

### Idempotency

**Problem:** Stripe may send the same webhook multiple times.

**Solution:** INSERT-as-gate pattern with unique constraints:

```sql
-- Primary guard
stripe_checkout_session_id TEXT NOT NULL UNIQUE

-- Secondary guard
stripe_event_id TEXT NOT NULL UNIQUE
```

The RPC uses `ON CONFLICT DO NOTHING` to atomically prevent duplicate inserts.

---

## API Routes

### POST /api/stripe/checkout

Creates a Stripe Checkout Session for subscription.

**Request:**

```json
{ "packId": "pro_75" }
```

**Response:**

```json
{ "url": "https://checkout.stripe.com/pay/cs_..." }
```

**Auth:** Required (uses session user)

**Features:**

- `mode: "subscription"` for recurring billing
- `allow_promotion_codes: true` for discount codes
- `billing_address_collection: "auto"` for tax calculation

### POST /api/stripe/webhook

Handles Stripe webhook events.

**Signature Verification:** Uses raw body + `STRIPE_WEBHOOK_SECRET`

**Events Handled:**

- `checkout.session.completed` → Grant initial credits
- `charge.refunded` → Mark purchase as refunded

> **Note:** For recurring credits on subscription renewal, handle `invoice.paid` event (not yet implemented).

---

## Database Schema

### credit_purchases Table

| Column                       | Type        | Description                       |
| ---------------------------- | ----------- | --------------------------------- |
| `id`                         | UUID        | Primary key                       |
| `user_id`                    | UUID        | References auth.users             |
| `stripe_checkout_session_id` | TEXT        | Unique, primary idempotency       |
| `stripe_event_id`            | TEXT        | Unique, secondary idempotency     |
| `stripe_payment_intent_id`   | TEXT        | Unique, for refund tracking       |
| `pack_id`                    | TEXT        | Pack identifier                   |
| `credits_amount`             | INTEGER     | Credits granted                   |
| `amount_paid_cents`          | INTEGER     | Payment amount                    |
| `currency`                   | TEXT        | Payment currency                  |
| `status`                     | TEXT        | pending/succeeded/failed/refunded |
| `created_at`                 | TIMESTAMPTZ | Created timestamp                 |
| `updated_at`                 | TIMESTAMPTZ | Updated timestamp                 |

### RLS Policies

- Users can read their own purchases only
- Users cannot insert/update/delete (service role only)

---

## Refund Policy (Phase 9 MVP)

**Current Behavior:**

- Refund events are recorded in the database
- Purchase status is marked as `'refunded'`
- **Credits are NOT automatically subtracted**

**Rationale:**

- Automatic credit subtraction could leave users with negative balances
- Could break in-progress generations
- Requires careful handling of edge cases

**Future Phase:**

- Implement admin dashboard for manual credit reversal
- Add atomic credit subtraction with balance validation

---

## Frontend UX

### Subscription Flow

1. User clicks "Subscribe" on pricing card
2. Button disabled + loading spinner shown
3. Checkout session created via API (subscription mode)
4. User redirected to Stripe Checkout (with promo code option)
5. After payment, user returns to `/dashboard/credits?purchase=success`
6. Success banner shown
7. Credits polled every 2s (max 10s)
8. If credits not updated, support message shown

### Features Enabled

- **Promotion codes**: Users can apply discount codes
- **Billing address**: Collected for tax calculation
- **Cancel anytime**: Users manage subscription in Stripe portal

---

## Environment Variables

| Variable                | Description            | Example                        |
| ----------------------- | ---------------------- | ------------------------------ |
| `STRIPE_SECRET_KEY`     | Stripe API secret key  | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...`                    |
| `STRIPE_PRICE_PRO_75`   | Price ID for Pro Pack  | `price_...`                    |
| `APP_URL`               | Base URL for redirects | `https://yourapp.com`          |

---

## Testing

### Stripe Test Mode

Use Stripe test mode keys for development:

- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Note the webhook signing secret output and set STRIPE_WEBHOOK_SECRET
```

### Manual Test Checklist

| Test Case                   | Expected Result                      |
| --------------------------- | ------------------------------------ |
| Buy PRO pack (test mode)    | Credits +75, purchase in history     |
| Replay webhook (Stripe CLI) | Credits still +75 (not +150)         |
| Cancel checkout             | No credits granted, "canceled" toast |
| Refresh success page        | No duplicate credits                 |
| Logged out → checkout       | Redirected to login                  |
| Double-click Buy button     | Button disabled, only one session    |

---

## Troubleshooting

### Credits not appearing after purchase

1. Check webhook logs in Stripe Dashboard
2. Check server logs for webhook errors
3. Verify `STRIPE_WEBHOOK_SECRET` is correct
4. Verify database migration has been run
5. Manual fix: Use Supabase SQL to grant credits

### Webhook signature verification failed

1. Ensure using raw body (not parsed JSON)
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output
3. Check for proxy/middleware modifying request body

### Invalid price ID error

1. Verify `STRIPE_PRICE_PRO_75` env var is set
2. Verify price exists in Stripe Dashboard
3. Check if using test vs live mode keys consistently

---

## Files

| File                                           | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `lib/stripe/config.ts`                         | Credit pack configuration |
| `lib/stripe/client.ts`                         | Stripe SDK initialization |
| `app/api/stripe/checkout/route.ts`             | Checkout session creation |
| `app/api/stripe/webhook/route.ts`              | Webhook handler           |
| `hooks/usePurchaseHistory.ts`                  | Purchase history hook     |
| `app/dashboard/credits/page.tsx`               | Credits page UI           |
| `supabase/migrations/008_credit_purchases.sql` | Database migration        |

---

_Last updated: 2026-02-04_
