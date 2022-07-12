const mongoose = require("mongoose");
const config = require("config")
const db = config.get('mongoURI')  //get any other values in json file

const connectDB = async() =>{
    try{
        await mongoose.connect(db);
        console.log("mongoDB connected...");

    }catch(err){
        console.error(err.message);
        console.log("err: ",err)
        // exit process with failure
        process.exit(1)
    }
}

module.exports = connectDB ;