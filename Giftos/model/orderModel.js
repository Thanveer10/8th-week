const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
mongoose.connect("mongodb://localhost:27017/userDB");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: uuidv4
},
  orderedUser: {
    type: mongoose.Schema.Types.ObjectId, // Reference the user by ID
    ref: "userDB1",
    required: true,
  },
  orderStatus: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refunded",
      "Returned",
      "Return Request",
    ], // Controlled values
    default: "Pending",
  },
  date: {
    type: Date,
    default: Date.now, // Automatically sets the date to the current timestamp
    required: true,
  },
  shippingAddress: {
    // addressType: {
    //     type: String,
    //     enum: ['Home', 'Work', 'Other'],
    //     required: true
    // },
    name: {
      type: String,
      required: true,
    },
    houseName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
      min: 100000,
      max: 999999,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    altPhone: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          if (v == null || v.trim() === "") return true;
          return /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid alternate phone number!`,
      },
    },
  },
  shippingCharge :{type: Number, required:false},
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productdata",
        required: true,
      },
      name: { type: String, required: true }, // Product name for snapshotting
      price: { type: Number, required: true }, // Price at the time of order
      quantity: { type: Number, required: true },
      discountAmount:{type: Number, required: true},
      total: { type: Number, required: true }, // Total for this item (price * quantity)
      // discountPrice:{type: Number, required: true}
    },
  ],
  coupenDiscount:{type:Number},
  grandTotal: {
    type: Number,
    required: true,
  },
  deliveryDate: {
    type: Date, // Use Date type instead of String
    // required: true,
  },

  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Online Payment"], // Controlled payment methods
      required: true,
    },
    gateway: { type: String, required: false },
    status: { type: String, enum: ["Pending", "Paid","Cancelled","Failed"], default: "Pending" },
    date: { type: Date, default: Date.now },
    beforePymentRefId: {
      type: String,
      required: false,
    }, //for razro payment ,before payment
    paymentId: { type: String, required: false }, // after successfully payment
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["Not Initiated", "Partial", "Full"],
      default: "Not Initiated",
    },
  },
  cartId: {
    type: String,
  },
  cancellationDate: {
    type: Date,
  },
});

// });

module.exports = mongoose.model("ordercollection", orderSchema);
