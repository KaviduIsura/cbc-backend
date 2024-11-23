import Student from "../models/student.js";

export function getStudent(req, res) {
  Student.find().then((studentList) => {
    res.json({
      message: studentList,
    });
  });
}

export function getStudentByName(req, res) {
  const name = req.params.name;

  Student.find({ name: name })
    .then((studentList) => {
      if (studentList.length == 0) {
        res.json({
          message: "Student Not Found",
        });
      } else {
        res.json({
          message: studentList,
        });
      }
    })
    .catch(() => {
      res.json({
        message: "Student Not Found",
      });
    });
}
export function saveStudent(req, res) {
  const student = new Student(req.body);

  student
    .save()
    .then(() => {
      res.json({
        message: "Student created",
      });
    })
    .catch(() => {
      res.json({
        message: "Error",
      });
    });
}
