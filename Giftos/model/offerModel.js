const mongoose= require('mongoose');

const offerSchema= new mongoose.Schema({
    type:{
        type:String,
        required:true,
        enum:['Product','Category','Referral']
    },
    title:{
        type:String,
        required:true
    },
    discountType:{
        type:String,
        required:true,
        enum:['percentage','amount']
    },
    discountValue:{
        type:Number,
        required:true
    },
    details:{
        type:String
    },
    image:{
        type:String
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'productdata'
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category'
    },
    isActive: {
        type: Boolean,
        default: true
    },
},
{timestamps:true})

module.exports = mongoose.model('Offer',offerSchema)