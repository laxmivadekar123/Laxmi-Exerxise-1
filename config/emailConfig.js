// import dotenv from 'dotenv'
const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer")

let transporter = nodemailer.createTransport({
    host: "mx1.a2d.email",
    port: 465,
    secure:true, //true for 465, false for other ports
    auth: {
        user: "web-admin@a2dweb.com", //Admin Gmail ID
        pass: "A2d@HOST##123" // Admin Gmail  password
    },
})

module.exports = transporter;
// export default transporter;