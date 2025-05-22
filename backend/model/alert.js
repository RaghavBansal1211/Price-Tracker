const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
   
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product",
        required:true,
    },

    email:{
        type:String,
        required:true,
    },

    targetPrice:{
        type:Number,
        required:true,
    },
},{timestamps:true});

const Alert = mongoose.model('alert',AlertSchema);
module.exports = Alert;

