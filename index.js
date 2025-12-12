// index.js (partial - showing the relevant part)
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import productRouter from "./routes/productRouter.js";
import orderRouter from "./routes/orderRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import cartRouter from "./routes/cartRouter.js";
import wishlistRouter from "./routes/wishlistRouter.js";
import cors from "cors";
import customerRouter from "./routes/customerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Mongodb Connection
const mongoUrl = process.env.MONGO_DB_URI;
mongoose.connect(mongoUrl, {});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Database Connected");
});

// middleware to handle token
app.use((req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token != null) {
    jwt.verify(token, process.env.SECRETE, (error, decoded) => {
      if (!error) {
        req.user = decoded;
      }
    });
  }
  next();
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use('/api/cart', cartRouter); 
app.use('/api/wishlist', wishlistRouter);
app.use("/api/customers", customerRouter);
app.use("/api/admins", adminRouter);

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});