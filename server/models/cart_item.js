const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  cart_id: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
  },
  quantity: {
    type: Number,
    default: 1,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
