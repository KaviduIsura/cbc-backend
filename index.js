import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import productRouter from "./routes/productRoute.js";
import userRouter from "./routes/userRouter.js";
import jwt, { decode } from "jsonwebtoken";

const app = express();

app.use(bodyParser.json());

// Mongodb Connection

const mongoUrl =
  "mongodb+srv://admin:1234@cluster0.tul2h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoUrl, {});

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("Database Connected");
});

app.use((req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log(token);

  if (token != null) {
    jwt.verify(token, "cbc-secrete-key-7973", (error, decoded) => {
      if (!error) {
        req.user = decoded;
      }
    });
  }
  next();
});

//Routes
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
