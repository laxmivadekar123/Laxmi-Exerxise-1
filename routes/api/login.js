const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth")
const User = require("../../models/User")
const bcrypt = require("bcryptjs")
const { check, validationResult } = require("express-validator");
const validation = require("express-validator");
const jwt = require("jsonwebtoken")
const config = require("config")
const bookidgen = require("bookidgen")
const transporter = require("../../config/emailConfig");
const { logger } = require("../../config/emailConfig");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/",auth,async(req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password") //it will leave the password in the data
        res.send(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send("server Error")
    }
});


// @route   POST api/login
// @desc    Authenticate user & get token
// @access  Public

/**
 * @swagger
 * /api/login/:
 *  post:
 *      summary: Login for user
 *      tags: [User_authentication]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */

router.post("/",[
    check("email","please include a valid email").isEmail(),
    check("password","password is required").exists()
],
async(req,res)=>{
    // console.log("validation result",validationResult(req))
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    
    const { email, password} = req.body;
    try{
        // see if user exists
        let user = await User.findOne({ email });
        if (!user){
            res.status(400).json({ errors: [{ msg: "email not found,please try to signup" }] });
        }

        const isMatch = await bcrypt.compare(password,user.password);
        console.log(password)
        console.log(user.password)

        if(!isMatch){
            return res.status(400).json({ errors: [{ msg:"passwords is incorrect" }]})
        }

        // Returns jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(payload,config.get("jwtSecret"),{ expiresIn:360000},
            (err, token)=>{
                if (err) throw err;
                res.json({ token });
            });

        // res.send("User Regestered")
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("server error")
    }
});


/**
 * @swagger
 * /api/login/changepassword:
 *  post:
 *      summary: Change user password
 *      tags: [User_authentication]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          password:
 *                              type: string
 *                              default: admin1
 *                          confirmPassword:
 *                              type: string
 *                              default: admin1
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */

// In these we need logged user token to change the password.
router.post("/changepassword", auth ,async (req,res) => {
    try{
        let {password,confirmPassword} = req.body;
        console.log(req.body);
        if (!password || !confirmPassword){
            res.status(400).send({ message: "Required all fields", status: false})
        }
        else{
            if (password !== confirmPassword){
                res.send({ status: "failed",message:"password and confirm passwords are not same"})
            }else{
                const salt = await bcrypt.genSalt(10)
                const hashpassword = await bcrypt.hash(password,salt)
                await User.findByIdAndUpdate(req.user.id,{
                    $set : { password: hashpassword} })
                res.status(200).send({ message:"Password changed successfully", status: true})
            }
    }
    }catch(err){
        console.log(err)
    }
});

/**
 * @swagger
 * /api/login/PasswordResetEmail:
 *  post:
 *      summary: PasswordResetEmail
 *      tags: [User_authentication]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                          
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */


router.post("/PasswordResetEmail", async(req,res)=>{
    const {email} = req.body;
    try{
        if (email){
            const user = await User.findOne({ email: email});
            const secret = user.id + config.get("jwtSecret");
            console.log(user.id)
            if(user){
                const token = jwt.sign({ userID: user.id }, secret, { expiresIn: "15m"})
                const link = `http://127.0.0.1:3000/api/user/reset/${user.id}/${token}` //the link is created in frontend like that link we aree passing
                // send Email
                let info = await transporter.sendMail({
                    from: "web-admin@a2dweb.com",
                    to: user.email,
                    subject: "codeRocket - Password Reset Link",
                    html: `<a href = ${link}> Click Here</a> to reset your password `
                })
                res.status(400).send({ 
                    "status": "success", 
                    "message": "Password reset Email sent...,Please check your email",
                    "id": user.id,
                    "token:": token,
                    "info": info
                 })
                console.log(link)
    
            }else{
                res.status(400).send({ "status": "failed", "message": "Email does not exist" })
            }
        }
        else{
            res.status(400).send({ "status": "failed", "message": "Email field is required" })
            
        }
    }catch(err){
        res.send("Email not found");
        console.log("error:",err.message,"user don't have account");
        // console.log(err)
    }
})


/**
 * @swagger
 * /api/login/userPasswordReset/{id}:
 *  put:
 *      summary: Change Password Admin
 *      tags: [User_authentication]
 *      parameters:
 *      - name: id
 *        in: path
 *        description: The id of an admin user
 *        required: true
 *        default: 0
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          password:
 *                              type: string
 *                              default: " "
 *                          confirmPassword:
 *                              type: string
 *                              default: " "
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */
router.put("/userPasswordReset/:id",async(req,res)=>{
    const {password, confirmPassword} = req.body
    const {id} = req.params;
    const user = await User.findById(id)
    const new_secret = config.get("jwtSecret");
    try{
        // jwt.verify(token, new_secret)
        // console.log(jwt.verify(token, new_secret))
        if(password && confirmPassword){
            if (password !== confirmPassword){
                res.send({ "status":"failed", "message": "Password and confirm passwords are not matching" })
            }else{
                const salt = await bcrypt.genSalt(10)
                const hashpassword = await bcrypt.hash(password,salt)
                await User.findByIdAndUpdate(user.id,{
                    $set : { password: hashpassword} })
                res.status(400).send({ "status": "success", "message": "Password resetted Successfully"})
            }
        }

    }catch(err){
        console.error("error:",err.message)
        res.send({ "status":"failed", "message": "Invalid Token" })
        console.log(err)
    }
})

/**
 * @swagger
 * /api/login/emailvalidate/:
 *  put:
 *      summary: Email Validadation
 *      tags: [User_authentication]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              default: " "
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */

router.put("/emailvalidate",[
    check("email","please include a valid email").isEmail()],
    async(req,res)=>{
    try{
        const {email} = req.body;
        const user=await User.findOne({ email })
        if (user){
            const link = `http://127.0.0.1:3000/api/user/reset/${user.id}` //the link is created in frontend like that link we aree passing
            // send Email
            let info = await transporter.sendMail({
                from: "web-admin@a2dweb.com",
                to: user.email,
                subject: "A2D-Email validation link",
                html: `<a href = ${link}> Click Here</a> to reset your password `
            })
            await  User.findOneAndUpdate({email:email},{
                $set:{
                    activeStatus: true 
                }
            })
            ,(err,data)=>{
                if(err){
                    res.status(400).send("Something went wrong please check once");
                    console.log(err);
                }else{
                    // console.log(link)
                     console.log(data)
                } 
            }
            res.status(200).send({ 
                "status": "success", 
                "message": "Email validation mail sent...,Please check your email",
                "id": user.id,
                "info": info
             })
             console.log("Email is valid")
            
        } 
        else{
            res.send("email is invalid")
        }
    }catch(err){
        res.send("email not found in db")
        console.log("error: ",err.message)
        console.log(err)
    }
})


module.exports = router;

