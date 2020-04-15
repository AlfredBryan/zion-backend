const jwt = require("jsonwebtoken");

const decodeToken = (req, res) => {
  const { token } = req.headers;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded) {
    res.status(422).send({ authenticated: false, message: "please login" });
  } else {
    return decoded;
  }
};

module.exports = decodeToken;
