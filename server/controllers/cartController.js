// update user cart data: /api/cart/update

import User from "../models/User.js";

export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;

    // Get userId from the authenticated request (set by authUser middleware)
    const userId = req.userId;

    if (!userId || !cartItems) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // Update the user's cart
    await User.findByIdAndUpdate(userId, { cartItems });

    res.json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};




// update user cart data: /api/cart/cart

//import User from "../models/User.js";

//export const updateCart = async (req, res) => {
    //try {
        //const {userId, cartItems} = req.body;
        //await User.findByIdAndUpdate(userId, {cartItems});
        //res.json({success: true, message: "Cart updated successfully"});
   // } catch (error) {

       // console.log(error.message);
       // res.json({success: false, message: error.message});
        
   // }
//}