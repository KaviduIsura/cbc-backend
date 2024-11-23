import User from "../models/User.js";
import bcrypt from "bcrypt";

export function createUser(req, res) {
  const newUserData = req.body;
  newUserData.password = bcrypt.hashSync(newUserData.password, 10);

  const user = new User(newUserData);

  user
    .save()
    .then(() => {
      res.json({
        message: "User created",
      });
    })
    .catch(() => {
      res.json({
        message: "Error User not created",
      });
    });
}
export function userLogin(req, res) {
  User.find({ email: req.body.email }).then((users) => {
    if (users.length == 0) {
      res.json({
        message: "User Not found",
      });
    } else {
      const user = users[0];
      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (isPasswordCorrect) {
        res.json({
          message: "Loged in",
        });
      } else {
        res.json({
          message: "User not Logged in ,Invalid Password ",
        });
      }
    }
  });
}
