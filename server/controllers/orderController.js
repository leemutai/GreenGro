

// place order COD: /api/order/cod

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from 'stripe';
import User from "../models/User.js";


export const placeOrderCOD = async (req, res) => {
    try {

        const userId = req.userId;
        const {   items, address} = req.body;
        if(!address || items.length === 0){
            return res.json({success: false, message: 'invalid data'});
        }

        //calculate total amount USING items
        let totalAmount = await items.reduce(async (acc, item)=> {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;

        }, 0);

        //add tax charges (2% of total amount)
        //amount += Math.floor(amount * 0.02);
        totalAmount += Math.floor(totalAmount  * 0.02);

        await Order.create({
            userId,
            items,
            amount: totalAmount,
            address,
            paymentType: 'COD',
        });
        return res.json({success: true, message: 'Order placed successfully'});
        
    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
}



// place order Stripe: /api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {

        const userId = req.userId;
        const {   items, address} = req.body;

        const {origin } = req.headers;
        if(!address || items.length === 0){
            return res.json({success: false, message: 'invalid data'});
        }

        let productData = [];

        //calculate total amount USING items
        let totalAmount = await items.reduce(async (acc, item)=> {
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice, 
                quantity: item.quantity,
            })
            return (await acc) + product.offerPrice * item.quantity;

        }, 0);

        //add tax charges (2% of total amount)
        //amount += Math.floor(amount * 0.02);
        totalAmount += Math.floor(totalAmount  * 0.02);

       const order =  await Order.create({
            userId,
            items,
            amount: totalAmount,
            address,
            paymentType: 'Online',
        });

        // Stripe payment integration/initialization
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // create line items for Stripe
        const line_items = productData.map((item)=>{
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02 ) * 100,
                },
                quantity: item.quantity,
            }

        })

        // create a checkout session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId: userId.toString(),
            }

        })



        return res.json({success: true,  url: session.url});
        
    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
}



// stripe webhook to verify payments actions : / stripe
export const stripeWebhooks = async (request, response) => {
    // Stripe gateway initialization
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];
    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        
    } catch (error) {
        response.status(400).send(`Webhook Error: ${error.message}`);
    }
    // hanldle the event
    switch (event.type) {
        case "payment_intent.succeeded":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;
            // getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId} = session.data[0].metadata;
            // mark payment as paid
            await Order.findByIdAndUpdate(orderId,{isPaid: true})
            // clear user cart
            await User.findByIdAndUpdate(userId,{cartItems: {}});
            break;            
        }
        case "payment_intent.payment_failed":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;
            // getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId} = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
            
        default:
            console.error(`Unhandled event type ${event.type}`);
            break;
    }
    response.json({received: true});
}

// Get orders by userId: /api/order/user

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or: [{paymentType: 'COD'}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
         res.json({success: true, orders});
        
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

// Get all orders:(for seller/ admin ) /api/order/seller

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{paymentType: 'COD'}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
         res.json({success: true, orders});
        
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}