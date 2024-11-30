import Order from "../models/Order.js";
import { isCustomer } from "./UserController.js";

export async function createOrder(req, res) {
  //CBC0001
  // Take the lastest order id
  if (!isCustomer(req)) {
    res.json({
      message: "Please login as customer to create orders",
    });
  }
  try {
    const lastestOrder = await Order.find().sort({ date: -1 }).limit(1);
    let orderId;

    if (lastestOrder == 0) {
      orderId = "CBC0001";
    } else {
      const currentOrderId = lastestOrder[0].orderId;
      const numberString = currentOrderId.replace("CBC", "");
      const number = parseInt(numberString);
      const newNumber = (number + 1).toString().padStart(4, "0");
      orderId = "CBC" + newNumber;
    }
    const newOrderData = req.body;
    newOrderData.orderId = orderId;
    newOrderData.email = req.user.email;

    const order = new Order(newOrderData);

    order.save();

    res.json({
      message: "Order is created",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

export async function getOrders(req, res) {
  try {
    const orders = await Order.find({ email: req.user.email });
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}
