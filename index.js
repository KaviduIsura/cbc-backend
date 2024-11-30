import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(bodyParser.json());

// Mongodb Connection

const mongoUrl = process.env.MONGO_DB_URI;
mongoose.connect(mongoUrl, {});

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("Database Connected");
});

app.use((req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log(token);

  if (token != null) {
    jwt.verify(token, process.env.SECRETE, (error, decoded) => {
      if (!error) {
        req.user = decoded;
      }
    });
  }
  next();
});

//Routes
app.use("/api/users", userRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
