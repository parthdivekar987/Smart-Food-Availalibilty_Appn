import { PaymentMethod, PaymentStatus, OrderStatus, TableSessionStatus } from "@prisma/client";
import Stripe from "stripe";
import { env } from "process";
import prisma from "../../shared/config/prisma.client";
import * as notificationService from "../notification/notification.service";
import { redisService } from "../../shared/services/redis.service";
import { finalizeClosedSession } from "../session/session.service";

// Currency used for card payments. Prices in the DB are stored in major units (e.g. rupees).
export const PAYMENT_CURRENCY = (env.PAYMENT_CURRENCY || "inr").toLowerCase();
// Stripe expects the smallest currency unit, except for zero-decimal currencies.
const ZERO_DECIMAL = new Set(["bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf"]);
const toMinorUnits = (amount: number) =>
    ZERO_DECIMAL.has(PAYMENT_CURRENCY) ? Math.round(amount) : Math.round(amount * 100);
// Sales tax applied on top of menu prices (e.g. 0.05 = 5% GST). Keep in sync with frontend VITE_TAX_RATE.
export const TAX_RATE = Number(env.TAX_RATE ?? 0.05);
/** Amount the guest owes: (total - discount) + tax */
export const amountDue = (totalAmount: number, discountAmount = 0) => {
    const discounted = Math.max(0, totalAmount - discountAmount);
    return Math.round(discounted * (1 + TAX_RATE) * 100) / 100;
};

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2022-11-15",
});

// create payment intent
export const createPaymentIntent = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        include: {
            items: true,
        },
    });
    if (!order) {
        throw new Error("Order not found");
    }
    if (order.totalAmount <= 0) {
        throw new Error("Order total amount is less than or equal to 0");
    }

    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Card payments are not configured. Please pay your server at the table.");
    }

    let payment = await prisma.payment.findUnique({
        where: {
            orderId: orderId,
        },
    })
    if (!payment) {
        payment = await prisma.payment.create({
            data: {
                orderId: orderId,
                amount: order.totalAmount,
                method: PaymentMethod.STRIPE,
                status: PaymentStatus.PENDING,
            },
        })
    }
    else if (payment.status === PaymentStatus.PAID) {
        throw new Error("This order has already been paid");
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: toMinorUnits(amountDue(order.totalAmount)),
        currency: PAYMENT_CURRENCY,
        metadata: {
            orderId: orderId,
            paymentId: payment.id,
        },
        automatic_payment_methods: {
            enabled: true,
        },
    })
    return {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,

    }
}

//process success payment
export const processSuccessPayment = async (
    orderId: string,
    method: PaymentMethod,
    discountAmount: number = 0,
    discountType: string | null = null,
    finalAmount: number | null = null,
    closedBy: string | null = null
) => {
    // Create or update payment record
    const existingPayment = await prisma.payment.findUnique({
        where: { orderId }
    });

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) throw new Error("Order not found");

    const calculatedFinalAmount = finalAmount ?? amountDue(order.totalAmount, discountAmount);

    if (existingPayment) {
        await prisma.payment.update({
            where: { orderId },
            data: {
                status: PaymentStatus.PAID,
                method: method,
                discountAmount,
                discountType,
                finalAmount: calculatedFinalAmount,
                paidAt: new Date(),
            },
        });
    } else {
        await prisma.payment.create({
            data: {
                orderId,
                amount: order.totalAmount,
                method: method,
                status: PaymentStatus.PAID,
                discountAmount,
                discountType,
                finalAmount: calculatedFinalAmount,
                paidAt: new Date(),
            },
        });
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
    });

    if (updatedOrder.tableSessionId) {
        await prisma.tableSession.update({
            where: { id: updatedOrder.tableSessionId },
            data: {
                status: TableSessionStatus.CLOSED,
                endedAt: new Date(),
            },
        });
    }

    if (updatedOrder.tableSessionId) {
        await redisService.del(`order:session:${updatedOrder.tableSessionId}`);
    }

    if (updatedOrder.tableSessionId) {
        await finalizeClosedSession({
            tableSessionId: updatedOrder.tableSessionId,
            reason: "PAID",
            method,
            amountPaid: calculatedFinalAmount,
            closedBy,
        });
    }

    // Let guest, waiter and kitchen screens update in real time
    notificationService.notifyOrderStatusChange({
        orderId: updatedOrder.id,
        tableSessionId: updatedOrder.tableSessionId || "",
        status: OrderStatus.COMPLETED,
    });
    return true;
}

