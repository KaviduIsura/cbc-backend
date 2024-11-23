import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import productRouter from "./routes/productRoute.js";

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

//Routes
app.use("/api/products", productRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
