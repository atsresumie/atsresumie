# ATSResumie Payment System Documentation

> Phase 9 & 10 Implementation: Stripe Monthly Subscription + Billing Management

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
		planName: "pro", // Server-authoritative plan name
	},
};
```

A helper `getPlanNameByPriceId(priceId)` derives the plan name from a Price ID for webhook use.

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

| Event                           | Action                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `checkout.session.completed`    | Grant credits + store `stripe_customer_id`                |
| `charge.refunded`               | Mark purchase as refunded                                 |
| `customer.subscription.created` | Set subscription fields in `user_profiles`                |
| `customer.subscription.updated` | Update status, cancellation scheduling                    |
| `customer.subscription.deleted` | Clear subscription fields (only if sub ID matches stored) |
| `invoice.paid`                  | Mark active (with safety: won't reactivate canceled subs) |
| `invoice.payment_failed`        | Mark `past_due`                                           |

**User Resolution Strategy:**

1. Primary: Look up `stripe_customer_id` in `user_profiles`
2. Fallback: Use `user_id` from subscription metadata

**Multi-Subscription Safety:**

- `deleted` event only clears fields if the deleted subscription ID matches `stripe_subscription_id` in DB
- `invoice.paid` verifies subscription ID match and won't reactivate canceled subscriptions

### POST /api/stripe/portal

Creates a Stripe Billing Portal session for the authenticated user.

**Response:**

```json
{ "url": "https://billing.stripe.com/session/..." }
```

**Auth:** Required (uses session user)

**Security:**

- `stripe_customer_id` is fetched from DB using authenticated user ID
- No client-supplied IDs — prevents opening portal for another customer
- Return URL uses `APP_URL` with `Origin` header fallback

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

### Subscription Columns (user_profiles)

Added by migration `011_subscription_fields.sql`:

| Column                   | Type          | Description                                      |
| ------------------------ | ------------- | ------------------------------------------------ |
| `stripe_customer_id`     | TEXT (UNIQUE) | Primary key for webhook user lookup              |
| `stripe_subscription_id` | TEXT (UNIQUE) | Current subscription ID                          |
| `subscription_status`    | TEXT          | `active`, `past_due`, `canceled`, etc.           |
| `plan_name`              | TEXT          | Derived from Price ID (`free` default)           |
| `cancel_at_period_end`   | BOOLEAN       | Cancel scheduled at period end                   |
| `cancel_at`              | TIMESTAMPTZ   | Specific cancellation date (portal uses this)    |
| `current_period_end`     | TIMESTAMPTZ   | Current billing period end (on SubscriptionItem) |

### RLS Policies

- Users can read their own purchases and profile only
- Webhook writes use service role (bypasses RLS)

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

## Billing Management

### Overview

The Billing & Subscription card on `/dashboard/credits` lets users view their subscription status and manage billing via Stripe Customer Portal.

### Architecture

```
Credits Page → useBilling hook → Supabase (user_profiles)
     ↓
"Manage billing" button → POST /api/stripe/portal → Stripe Portal Session
     ↓
Redirect → Stripe-hosted Customer Portal → Webhook → DB update
```

### UI States

| State     | Badge        | Info Shown                               | Actions                  |
| --------- | ------------ | ---------------------------------------- | ------------------------ |
| Active    | ✅ Active    | "Renews on [date]"                       | Manage billing           |
| Canceling | ⚠️ Canceling | "Cancels on [date]"                      | Manage billing (undo)    |
| Past Due  | 🔴 Past Due  | "Payment failed, update payment method"  | Manage billing (primary) |
| Canceled  | Canceled     | "Subscription has ended"                 | Manage billing           |
| No sub    | No Sub       | "No active subscription. Upgrade to Pro" | Upgrade to Pro           |
| Migration | ⚠️ Warning   | "Database update required"               | —                        |

### Key Gotcha: `cancel_at` vs `cancel_at_period_end`

> **Important:** Stripe Customer Portal sets `cancel_at` (a specific date) instead of `cancel_at_period_end: true` when a user cancels. Both must be checked:

```typescript
// In useBilling.ts
const isCanceling =
	billing?.subscriptionStatus === "active" &&
	(billing.cancelAtPeriodEnd === true || billing.cancelAt != null);
```

### Stripe SDK v20 Compatibility

- `current_period_end` is on `SubscriptionItem`, not `Subscription`
- Invoice subscription ID is at `invoice.parent.subscription_details.subscription`

### Portal Pre-requisites

1. Enable Customer Portal in [Stripe Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Set cancellation mode to "At end of billing period"
3. Enable: invoice history, payment method updates, subscription cancellation

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

# Option 1: Run dev server + webhook listener together (recommended)
pnpm dev

# Option 2: Run manually in separate terminals
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

> **Note:** `pnpm dev` uses `concurrently` to run both Next.js and Stripe CLI together. The webhook signing secret from `STRIPE_WEBHOOK_SECRET` in `.env` is used automatically.

### Manual Test Checklist

| Test Case                   | Expected Result                      |
| --------------------------- | ------------------------------------ |
| Buy PRO pack (test mode)    | Credits +75, purchase in history     |
| Replay webhook (Stripe CLI) | Credits still +75 (not +150)         |
| Cancel checkout             | No credits granted, "canceled" toast |
| Refresh success page        | No duplicate credits                 |
| Logged out → checkout       | Redirected to login                  |
| Double-click Buy button     | Button disabled, only one session    |
| Cancel via portal           | Card shows "Canceling" + end date    |
| Undo cancel via portal      | Card reverts to "Active"             |
| Past due payment            | Card shows "Past Due" + warning      |

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

| File                                              | Purpose                         |
| ------------------------------------------------- | ------------------------------- |
| `lib/stripe/config.ts`                            | Credit pack + plan name config  |
| `lib/stripe/client.ts`                            | Stripe SDK initialization       |
| `app/api/stripe/checkout/route.ts`                | Checkout session creation       |
| `app/api/stripe/portal/route.ts`                  | Billing Portal session creation |
| `app/api/stripe/webhook/route.ts`                 | Webhook handler (7 events)      |
| `hooks/usePurchaseHistory.ts`                     | Purchase history hook           |
| `hooks/useBilling.ts`                             | Subscription billing state hook |
| `app/dashboard/credits/page.tsx`                  | Credits + billing page UI       |
| `supabase/migrations/008_credit_purchases.sql`    | Credit purchases migration      |
| `supabase/migrations/011_subscription_fields.sql` | Subscription fields migration   |

---

---

## Development Scripts

The following scripts are available for payment development:

| Script               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`           | Start Next.js + Stripe webhook listener together |
| `pnpm dev:next`      | Start Next.js only (no webhooks)                 |
| `pnpm stripe:listen` | Start Stripe webhook listener only               |

> **Requirement:** Stripe CLI must be installed (`brew install stripe/stripe-cli/stripe`) and logged in (`stripe login`).

---

_Last updated: 2026-02-14_
