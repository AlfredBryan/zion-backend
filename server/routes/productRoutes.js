const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const Validator = require('validator');
require('dotenv').config();

const authenticate = require('../middleware/authentication');
const helper = require('../middleware/helper');

const Product = require('../models/product');
const Order = require('../models/order');
const Cart = require('../models/cart');
const CartItem = require('../models/cart_item');
const User = require('../models/user');

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'posts',
  allowedFormats: ['jpg', 'png'],
  transformation: [{ width: 500, height: 500, crop: 'limit' }],
});

const parser = multer({ storage: storage }).single('image');

const router = express.Router();

router.get('/products', (req, res) => {
  Product.find({})
    .then((product) => {
      if (product.length < 1) {
        res
          .status(404)
          .send({ status: 'failed', message: 'no products found' });
      } else {
        res.status(200).send({ status: 'successful', data: product });
      }
    })
    .catch((error) => {
      throw error;
    });
});

// Admin can add new products on platform
router.post(
  '/add_product',
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
            .send({ status: 'failed', message: 'error adding product' });
        } else {
          res.status(201).send({ status: 'successful', data: product });
        }
      })
      .catch((error) => {
        throw error;
      });
  }
);

// User can add a product to cart
router.post(
  '/product_select/:id',
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const token = helper(req);
    // console.log(token)
    User.findOne({ _id: token.id })
      .then((user) => {
        Product.findOne({ _id: req.params.id }).then(async(product) => {
          if (!product) {
            return res.send('Product does not exist');
          }

          Cart.findOne({ user_id: user._id, ordered: false }).then((cart) => {
            // console.log(cart)
            // return res.send(cart)
            if (!cart) {
              let new_cart = new Cart({
                user_id: user._id
              });

              new_cart.save((error) => {
                if (error) return res.send(error);
              });

              let cart_item = new CartItem({
                cart_id: new_cart._id,
                product: product._id,
              });

              cart_item.save((error) => {
                if (error) return res.send(error);
              });

              return res.send({ message: 'Prduct has been added successfully', new_cart_item: cart_item, cart: new_cart });
            }

            CartItem.findOne({ cart_id: cart._id, product: product._id }).then(
              (cart_item) => {
                if (cart_item) {
                  return res.send({message:'Product has been added already', new_cart_item: cart_item, cart});
                }

                let new_cart_item = new CartItem({
                  cart_id: cart._id,
                  product: product._id,
                });

                new_cart_item.save((error) => {
                  if (error) return res.send(error);
                });
                return res.send({ new_cart_item, cart, product });
              }
            );
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
  '/cart',
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const token = helper(req);
    Cart.findOne({ user_id: token.id, ordered: false }).then((cart) => {
      if (!cart) {
        // return res.status(400).send('nothing')
        return res.status(200).send({ message: 'Nothing in cart yet' });
      }

      CartItem.find({ cart_id: cart._id }).then(async(cart_items) => {
        if (cart_items.length < 1) {
          return res.status(200).send({ message: 'Nothing in cart yet' });
        }

        let cart_products = [];

        for (let i = 0; i < cart_items.length; i++) {
          const item = cart_items[i];

          const product = await Product.findOne({ _id: item.product });

          if (product) {
            let data = {
              id: product._id,
              quantity: item.quantity,
              image: product.image,
              name: product.product_name,
              price: product.price,
              cost: product.price * item.quantity,
            };

            cart_products.push(data);
          }
        }
        
        return res.status(200).send({ data: cart_products, cart });
      });

    });
  }
);

// View user by user Id
router.get(
  '/view_user/:id',
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  authenticate.checkAdmin,
  (req, res) => {
    User.findOne({ _id: req.params.id })
      .then((user) => {
        if (!user) {
          res.status(404).send({ message: 'user not found' });
        }
        res.status(200).send({ status: 'successful', data: user });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }
);

//user can order a design
router.post(
  '/order',
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
  '/user_order',
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    Order.find({}).then((orders) => {
      if (orders.length < 1) {
        res.status(200).send({ message: 'No orders yet' });
      }
      res.status(200).send({ success: true, data: orders });
    });
  }
);

router.get(
  '/cart/delete/:id',
  authenticate.checkTokenExists,
  authenticate.checkTokenValid,
  (req, res) => {
    const { id } = req.params;
    const { product } = req.query;
    const token = helper(req);
    Cart.findOne({ user_id: token.id, ordered: false, _id: id }).then((cart) => {
      if (!cart) {
        res.status(200).send({ message: 'Item does not exist in the cart' });
      }

      CartItem.findOne({ product, cart_id: cart._id }).then(item => {
        if (item) {
          item.delete();
        }
      })

      res.status(200).send('Successful');
    });
  }
);

module.exports = router;
