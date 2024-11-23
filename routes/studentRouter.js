import express from "express";
import Student from "../models/student.js";
import {
  deleteStudent,
  getStudent,
  getStudentByName,
  saveStudent,
} from "../controllers/StudentController.js";

//create student router
const studentRouter = express.Router();

studentRouter.get("/", getStudent);

studentRouter.post("/", saveStudent);

studentRouter.delete("/:name", deleteStudent);

studentRouter.get("/:name", getStudentByName);

export default studentRouter;
