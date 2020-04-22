const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartSchema = new Schema({
  user_id: {
    type: String
  },
  ordered: {
    type: Boolean,
    default: false
  },
  quantity: {
    type: Number,
    default: 1
  },
  product: [
    {
      type: Schema.Types.Array
    }
  ]
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
