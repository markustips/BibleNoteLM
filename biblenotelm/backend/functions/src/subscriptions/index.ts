/**
 * Subscription Management Functions
 * Handle Stripe subscriptions and billing
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {
  requireAuth,
  requireSuperAdmin,
  logDataAccess,
} from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { checkRateLimit, rateLimits } from '../middleware/rateLimit';
import { SubscriptionDocument } from '../types';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// ============================================
// CREATE SUBSCRIPTION
// ============================================

export const createSubscription = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Rate limiting
  await checkRateLimit(userId, 'create_subscription', rateLimits.subscription);

  // Validate input
  const { tier, priceId, paymentMethodId } = validate(data, schemas.createSubscription);

  // Get user details
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  let stripeCustomerId = userData.stripeCustomerId;

  // Create Stripe customer if doesn't exist
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.displayName,
      metadata: {
        userId,
      },
    });

    stripeCustomerId = customer.id;

    // Save customer ID to user document
    await admin.firestore().collection('users').doc(userId).update({
      stripeCustomerId,
    });
  }

  // Attach payment method if provided
  if (paymentMethodId) {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  // Save subscription to Firestore
  const subscriptionData: SubscriptionDocument = {
    id: subscription.id,
    userId,
    tier,
    status: subscription.status as any,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_start * 1000
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_end * 1000
    ),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await admin.firestore().collection('subscriptions').doc(subscription.id).set(subscriptionData);

  // Update user subscription tier
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionTier: tier,
    subscriptionStatus: subscription.status,
    subscriptionStartDate: subscriptionData.currentPeriodStart,
    subscriptionEndDate: subscriptionData.currentPeriodEnd,
  });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'subscriptions', subscription.id, {
    action: 'create_subscription',
    tier,
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

  return {
    success: true,
    data: {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    },
  };
});

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { subscriptionId, cancelReason } = data;

  if (!subscriptionId) {
    throw new functions.https.HttpsError('invalid-argument', 'subscriptionId is required');
  }

  // Rate limiting
  await checkRateLimit(userId, 'cancel_subscription', rateLimits.subscription);

  // Get subscription
  const subDoc = await admin.firestore().collection('subscriptions').doc(subscriptionId).get();

  if (!subDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Subscription not found');
  }

  const subData = subDoc.data() as SubscriptionDocument;

  // Verify ownership
  if (subData.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Not your subscription');
  }

  // Cancel subscription in Stripe (at period end)
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    cancellation_details: {
      comment: cancelReason || 'User requested cancellation',
    },
  });

  // Update Firestore
  await admin.firestore().collection('subscriptions').doc(subscriptionId).update({
    status: 'cancelled',
    cancelledAt: admin.firestore.Timestamp.now(),
    cancelReason,
    updatedAt: admin.firestore.Timestamp.now(),
  });

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'cancelled',
  });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'subscriptions', subscriptionId, {
    action: 'cancel_subscription',
    reason: cancelReason,
  });

  return {
    success: true,
    data: {
      message: 'Subscription will be cancelled at the end of the billing period',
    },
  };
});

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

export const getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Get user's active subscription
  const subQuery = await admin
    .firestore()
    .collection('subscriptions')
    .where('userId', '==', userId)
    .where('status', 'in', ['active', 'trialing'])
    .limit(1)
    .get();

  if (subQuery.empty) {
    return {
      success: true,
      data: {
        hasSubscription: false,
        tier: 'free',
      },
    };
  }

  const subDoc = subQuery.docs[0];
  const subData = subDoc.data() as SubscriptionDocument;

  // Log the action
  await logDataAccess(userId, 'READ', 'subscriptions', subDoc.id);

  return {
    success: true,
    data: {
      hasSubscription: true,
      tier: subData.tier,
      status: subData.status,
      currentPeriodEnd: subData.currentPeriodEnd,
    },
  };
});

// ============================================
// STRIPE WEBHOOK HANDLER
// ============================================

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Update subscription in Firestore
  await admin
    .firestore()
    .collection('subscriptions')
    .doc(subscription.id)
    .set(
      {
        status: subscription.status,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_start * 1000
        ),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

  // Update user status
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: subscription.status,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Update subscription status
  await admin.firestore().collection('subscriptions').doc(subscription.id).update({
    status: 'expired',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // Downgrade user to free tier
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionTier: 'free',
    subscriptionStatus: 'expired',
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Save invoice to Firestore
  await admin
    .firestore()
    .collection('subscriptions')
    .doc(subscriptionId)
    .collection('invoices')
    .doc(invoice.id)
    .set({
      id: invoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      paidAt: admin.firestore.Timestamp.fromMillis((invoice.status_transitions.paid_at || 0) * 1000),
      invoiceURL: invoice.hosted_invoice_url || null,
      receiptURL: (invoice as any).receipt_url || null,
      createdAt: admin.firestore.Timestamp.now(),
    });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Get subscription to find userId
  const subDoc = await admin.firestore().collection('subscriptions').doc(subscriptionId).get();

  if (!subDoc.exists) return;

  const subData = subDoc.data() as SubscriptionDocument;

  // Update subscription status
  await admin.firestore().collection('subscriptions').doc(subscriptionId).update({
    status: 'past_due',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  await admin.firestore().collection('users').doc(subData.userId).update({
    subscriptionStatus: 'past_due',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // TODO: Send email notification to user about failed payment
}

// ============================================
// ADMIN: GET ALL SUBSCRIPTIONS (Super Admin Only)
// ============================================

export const getAllSubscriptions = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // ONLY super admin can access
  await requireSuperAdmin(userId);

  const { page = 1, limit = 50, status } = data;

  let query = admin.firestore().collection('subscriptions').orderBy('createdAt', 'desc');

  if (status) {
    query = query.where('status', '==', status) as any;
  }

  const snapshot = await query.limit(limit).get();

  const subscriptions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // REDACT user-specific data for privacy
    userId: '[REDACTED]',
  }));

  // Log the action
  await logDataAccess(userId, 'READ', 'subscriptions', undefined, {
    action: 'get_all_subscriptions',
    count: subscriptions.length,
  });

  return {
    success: true,
    data: subscriptions,
    pagination: {
      page,
      limit,
      total: snapshot.size,
    },
  };
});
