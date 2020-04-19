const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const Validator = require("validator");
require("dotenv").config();

const authenticate = require("../middleware/authentication");
const helper = require("../middleware/helper");

const Product = require("../models/product");
const Order = require("../models/order");
const Cart = require("../models/cart");
const User = require("../models/user");

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "posts",
  allowedFormats: ["jpg", "png"],
  transformation: [{ width: 500, height: 500, crop: "limit" }],
});

const parser = multer({ storage: storage }).single("image");

const router = express.Router();

router.get("/products", (req, res) => {
  Product.find({})
    .then((product) => {
      if (product.length < 1) {
        res
          .status(404)
          .send({ status: "failed", message: "no products found" });
      } else {
        res.status(200).send({ status: "successful", data: product });
      }
    })
    .catch((error) => {
      throw error;
    });
});

// Admin can add new products on platform
router.post(
  "/add_product",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  parser,
  (req, res) => {
    const token = helper(req);
    const { product_name, description, price } = req.body;
    Product.create({
      product_name,
      image: req.file.secure_url,
      description,
      price,
      posted_by: token.id,
    })
      .then((product) => {
        if (!product) {
          res
            .status(500)
            .send({ status: "failed", message: "error adding product" });
        } else {
          res.status(201).send({ status: "successful", data: product });
        }
      })
      .catch((error) => {
        throw error;
      });
  }
);

// User can add a product to cart
router.post(
  "/product_select/:id",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const token = helper(req);
    User.findOne({ _id: token.id })
      .then((user) => {
        Product.findOne({ _id: req.params.id }).then((product) => {
          let cart = new Cart({
            user_id: token.id,
            product: product,
          });
          user.cart.push(cart);
          cart.save((error) => {
            if (error) return res.send(error);
          });
          user.save((error) => {
            if (error) return res.send(error);
          });
          product.picked.push(token.id);
          product.save((error, p) => {
            if (error) return res.send(error);

            res.status(201).send(p);
          });
        });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }
);

//View Cart
router.get(
  "/cart",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const token = helper(req);
    Cart.find({ user_id: token.id, ordered: false }).then((cart) => {
      if (cart.length < 1) {
        res.status(200).send({ message: "Nothing in cart yet" });
      }

      res.status(200).send(cart);
    });
  }
);

// View user by user Id
router.get(
  "/view_user/:id",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  authenticate.checkAdmin,
  (req, res) => {
    User.findOne({ _id: req.params.id })
      .then((user) => {
        if (!user) {
          res.status(404).send({ message: "user not found" });
        }
        res.status(200).send({ status: "successful", data: user });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }
);

//user can order a design
router.post(
  "/order",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const token = helper(req);
    Cart.find({ user_id: token.id }).then((cart) => {
      Order.create({
        user_id: token.id,
        cart: cart,
      });
    });
    // User cart is updated
    Cart.updateMany(
      { user_id: token.id, ordered: false },
      { $set: { ordered: true } }
    ).then((updatedcart) => {
      res.send(updatedcart);
    });
  }
);

//Fetch Orders
router.get(
  "/user_order",
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    Order.find({}).then((orders) => {
      if (orders.length < 1) {
        res.status(200).send({ message: "No orders yet" });
      }
      res.status(200).send({ success: true, data: orders });
    });
  }
);

module.exports = router;
