const mongoose = require('mongoose');

const transactionSchema=new mongoose.Schema({
    type: {
        type:String,
        enum: ['credit', 'debit'], 
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: false
    }
},{
    timestamps: true
});

const walletSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'userDB1',
        required:true
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    },
    transactions:[transactionSchema]
},{
    timestamps:true
})

module.exports = mongoose.model('wallet',walletSchema);