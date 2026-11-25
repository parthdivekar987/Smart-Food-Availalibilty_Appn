import axiosClient from './axiosClient';

export type StaffPaymentMethod = 'CASH' | 'CARD' | 'MOMO' | 'VNPAY' | 'ZALOPAY';

export const paymentApi = {
  /** Create a Stripe PaymentIntent for an order; returns { clientSecret, paymentId } */
  createStripeIntent: (orderId: string) =>
    axiosClient.post('/payment/create-intent', { orderId }) as unknown as Promise<{ clientSecret: string; paymentId: string }>,

  /** Ask the backend to verify a succeeded PaymentIntent with Stripe and record it */
  verifyStripePayment: (paymentIntentId: string) =>
    axiosClient.post('/payment/stripe/verify', { paymentIntentId }),

  /** Staff records a payment taken at the table (cash, card terminal, wallet). Closes the session. */
  confirmPayment: (data: {
    orderId: string;
    paymentMethod: StaffPaymentMethod;
    discountAmount?: number;
    discountType?: 'PERCENTAGE' | 'FIXED' | null;
    finalAmount?: number;
  }) => axiosClient.post('/payment/confirm-cash', data),
};
