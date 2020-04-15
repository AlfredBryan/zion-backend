const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user_id: {
    type: String,
  },
  cart: [
    {
      type: Schema.Types.Array,
    },
  ],
  date_ordered: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
