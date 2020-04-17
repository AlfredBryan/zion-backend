const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  posted_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  product_name: {
    type: String,
    required: [true, "product name is required"],
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: [true, "description field is required"],
  },
  price: {
    type: String,
    required: [true, "price field is required"],
  },
  inCart: {
    type: Boolean,
    default: false,
  },
  picked: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  date_added: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
