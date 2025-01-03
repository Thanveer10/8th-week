
const mongoose= require('mongoose')
mongoose.connect("mongodb://localhost:27017/userDB")

const cartSchema =new mongoose.Schema({
    UserId:{
    //  type:mongoose.Schema.Types.ObjectId,
     type:String,
     ref:'userDB',
     reqire:true
    },
   Product: [
    {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'productdata' }, // Reference to Product model
        quantity: { type: Number, require: true },
        price: { type: Number }, // Stores the effective price
        totalPrice: { type: Number }, // Total price for the quantity
        finalTotalPrice: { type: Number },
        discountValue: { type: Number}
    }
    ], 
 totalCartPrice: {
        type: Number,
        required: true,
        default: 0
    },
    finalTotalCartPrice: {
        type: Number,
        required: true,
        default: 0
    },
discountPrice: { 
    type: Number,
    //  require: true,
    default: 0
    }
})

module.exports=mongoose.model('cartcollection',cartSchema)