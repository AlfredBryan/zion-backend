const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

require("dotenv").config();
//connect to mongodb
mongoose.connect(
  process.env.DB_URL,
  {
    useNewUrlParser: true,
    autoIndex: false,
    useUnifiedTopology: true,
  },
  () => {
    console.log("connected to mongoDB");
  }
);

// //configuring cors
// const accesslist = ["http://localhost:3000/", "http://www.swanky.com"];

// var corsOptions = {
//   origin: function(origin, callback) {
//     if (accesslist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   }
// };

//middleware setup
app.use(logger("dev"));
app.use(cookieParser());
app.use(cors("*"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Adding routes
app.use("/api/v1", productRoutes);
app.use("/api/v1", userRoutes);

//setting up port
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});

module.exports = app;
