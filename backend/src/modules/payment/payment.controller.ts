import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import * as momoService from './momo.service';
import { PaymentMethod } from '@prisma/client';
import Stripe from 'stripe';
import prisma from '../../shared/config/prisma.client';

const stripe = paymentService.stripe;

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });
    const result = await paymentService.createPaymentIntent(orderId);
    res.status(200).json(result);
  }
  catch (error: any) {
    console.error("[payment] create intent failed:", error.message);
    res.status(400).json({ message: error.message || "Failed to create payment intent" });
  }
};
export const confirmCashPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMethod, discountAmount, discountType, finalAmount } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });
    if (discountAmount != null && (typeof discountAmount !== 'number' || discountAmount < 0)) {
      return res.status(400).json({ message: 'discountAmount must be a non-negative number' });
    }
    if (finalAmount != null && (typeof finalAmount !== 'number' || finalAmount < 0)) {
      return res.status(400).json({ message: 'finalAmount must be a non-negative number' });
    }
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status === 'PAID') return res.status(409).json({ message: 'This order has already been paid' });

    // Map payment method string to enum
    let method: PaymentMethod = PaymentMethod.CASH;
    if (paymentMethod === 'CARD' || paymentMethod === 'STRIPE') {
      method = PaymentMethod.STRIPE;
    } else if (paymentMethod === 'MOMO') {
      method = PaymentMethod.MOMO;
    } else if (paymentMethod === 'VNPAY') {
      method = PaymentMethod.VNPAY;
    } else if (paymentMethod === 'ZALOPAY') {
      method = PaymentMethod.ZALOPAY;
    }

    await paymentService.processSuccessPayment(
      orderId,
      method,
      discountAmount || 0,
      discountType || null,
      finalAmount || null,
      (req.user as any)?.fullName || null
    );
    res.json({ message: 'Payment confirmed. Session closed.' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// WEBHOOK: Stripe tự gọi vào đây (QUAN TRỌNG)
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Xác thực request này thực sự đến từ Stripe
    event = stripe.webhooks.constructEvent(
      req.body, // Lưu ý: Body phải là Raw Buffer (cần config express)
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle sự kiện thanh toán thành công
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    console.log(`💰 Payment succeeded for Order ${orderId}`);

    // Gọi service update DB
    if (orderId) {
      const existing = await prisma.payment.findUnique({ where: { orderId } });
      if (existing?.status !== 'PAID') {
        await paymentService.processSuccessPayment(orderId, PaymentMethod.STRIPE);
      }
    }
  }

  res.json({ received: true });
};

/**
 * Client-side confirmation after Stripe.js reports success.
 * Re-fetches the PaymentIntent from Stripe (never trusts the client), so it is safe to expose publicly,
 * and is idempotent alongside the webhook. Lets payments record correctly even without a webhook (local dev).
 */
export const verifyStripePayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId is required' });

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderId = intent.metadata?.orderId;
    if (!orderId) return res.status(400).json({ message: 'Payment is not linked to an order' });
    if (intent.status !== 'succeeded') {
      return res.status(409).json({ message: `Payment not completed (status: ${intent.status})` });
    }

    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status !== 'PAID') {
      await paymentService.processSuccessPayment(orderId, PaymentMethod.STRIPE);
    }
    res.json({ message: 'Payment confirmed', orderId });
  } catch (error: any) {
    console.error('[payment] verify failed:', error.message);
    res.status(400).json({ message: error.message || 'Could not verify payment' });
  }
};

// ==================== MOMO PAYMENT ====================

export const createMoMoPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const result = await momoService.createMoMoPayment(orderId);
    res.json({
      success: true,
      payUrl: result.payUrl,
      qrCodeUrl: result.qrCodeUrl,
      deeplink: result.deeplink,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('MoMo Create Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create MoMo payment' });
  }
};

export const momoIPN = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('📥 MoMo IPN:', JSON.stringify(data, null, 2));

    if (!momoService.verifyMoMoIPN(data)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    if (data.resultCode === 0) {
      await momoService.processMoMoSuccess(data);
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkMoMoStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const result = await momoService.checkMoMoPaymentStatus(orderId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};