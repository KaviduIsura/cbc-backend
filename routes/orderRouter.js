import express from "express";
import { createOrder } from "../controllers/OrderController.js";

const orderRouter = express.Router();

orderRouter.post("/", createOrder);

export default orderRouter;
