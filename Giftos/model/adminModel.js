const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/userDB")
const bcrypt = require('bcrypt');

mongoose.set('strictQuery',false);
const adminSchema = new mongoose.Schema({
    Username:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true
    },
    Mobile:{
        type:String,
        required:true
    },
    Password:{
        type:String,
        required:true
    },
    isAdmin:{type:Boolean}

   
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports={Admin}
