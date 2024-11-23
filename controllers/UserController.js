import User from "../models/User.js";
export function createUser(req, res) {
  const user = new User(req.body);

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
