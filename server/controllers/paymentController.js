const {
    createOrderForUser,
    listPaymentHistory,
    processWebhook,
    verifyBrowserPayment,
    verifyWebhookSignature,
} = require('../services/paymentService');

async function createOrder(req, res, next) {
    try {
        if (typeof req.body?.plan !== 'string') {
            return res.status(400).json({ message: 'Subscription plan is required.' });
        }
        const order = await createOrderForUser(req.user.id, req.body.plan);
        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
}

async function verifyPayment(req, res, next) {
    try {
        const fields = [
            req.body?.razorpay_order_id,
            req.body?.razorpay_payment_id,
            req.body?.razorpay_signature,
        ];
        if (!fields.every((field) => typeof field === 'string' && field.length > 0)) {
            return res.status(400).json({ message: 'Payment ID, order ID, and signature are required.' });
        }
        const subscription = await verifyBrowserPayment(req.user.id, {
            orderId: req.body.razorpay_order_id,
            paymentId: req.body.razorpay_payment_id,
            signature: req.body.razorpay_signature,
        });
        res.status(200).json({
            success: true,
            message: 'Payment verified and Plus activated.',
            subscription,
        });
    } catch (error) {
        next(error);
    }
}

async function history(req, res, next) {
    try {
        res.status(200).json({ payments: await listPaymentHistory(req.user.id) });
    } catch (error) {
        next(error);
    }
}

async function webhook(req, res, next) {
    try {
        verifyWebhookSignature(req.body, req.get('x-razorpay-signature'));
        let payload;
        try {
            payload = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).json({ message: 'Webhook body must be valid JSON.' });
        }
        const payment = payload.payload?.payment?.entity;
        await processWebhook({
            eventId: req.get('x-razorpay-event-id'),
            eventType: payload.event,
            payment,
        });
        res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
}

module.exports = { createOrder, history, verifyPayment, webhook };
