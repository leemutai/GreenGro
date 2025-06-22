

// place order COD: /api/order/cod

import Order from "../models/Order.js";
import Product from "../models/Product.js";

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