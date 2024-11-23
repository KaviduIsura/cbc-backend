import express from "express";
import { createUser } from "../controllers/UserController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);

export default userRouter;
