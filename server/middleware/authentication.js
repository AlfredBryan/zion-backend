const jwt = require("jsonwebtoken");
require("dotenv").config();

class authenticate {
  /**
   * check if token exist in request header
   * @param {object} req - api request
   * @param {object} res - api response
   * @param {function} next - next middleware function
   * @return {json}
   */
  static checkTokenExists(req, res, next) {
    const { token } = req.headers;

    if (token === undefined || token === null || token === "") {
      res
        .status(422)
        .send({ authenticated: false, message: "unidentified user" });
    } else {
      return next();
    }
  }

  /**
   * check token valid
   * @param {object} req - api request
   * @param {object} res - api response
   * @param {function} next - next middleware function
   * @return {json}
   */
  static checkTokenValid(req, res, next) {
    const { token } = req.headers;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      res.status(422).send({ authenticated: false, message: "invalid token" });
    } else {
      return next();
    }
  }

  /**
   * @param {object} req - api request
   * @param {object} res - api response
   * @param {function} next - next middleware function
   * @return {json}
   */
  static checkAdmin(req, res, next) {
    const { token } = req.headers;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.is_admin !== true) {
      res
        .status(422)
        .send({ authenticated: false, message: "you're not admin" });
    } else {
      return next();
    }
  }
}

module.exports = authenticate;
