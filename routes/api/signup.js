const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/User");

// @route   POST api/signup
// @desc    Register user
// @access  Public

/**
 * @swagger
 * /api/signup/:
 *  post:
 *      summary: SignUp User
 *      tags: [User-authorization]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                              default: " "
 *                          email:
 *                              type: string
 *                              default: " "
 *                          password:
 *                              type: string
 *                              default: " "
 *      responses:
 *          200:
 *              description: Success
 *          default:
 *              description: Default response for this api
 */

router.post("/",[
        check("name","Name is required").not().isEmpty(),
        check("email","please include a valid email").isEmail(),
        check("password","please enter a password 6 or more characters").isLength({ min:6})
    ],
    async(req,res)=>{
        // console.log("validation result",validationResult(req))
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }

        
        const {name, email, password} = req.body;
        try{
            // see if user exists
            let user = await User.findOne({ email });
            if (user){
                res.status(400).json({ errors: [{ msg: "user already exists" }] });
            }
            else{
                // instance of user
                user = new User({
                    name,
                    email,
                    password
                })

                
                // Encrypt password
                const salt = await bcrypt.genSalt(10); //max we will give that much it is secure but slow downs our server
                user.password = await bcrypt.hash(password,salt);
                await user.save();
                res.status(201).send(" user registered successfully");


                // Returns jsonwebtoken
                // const payload = {
                //     user: {
                //         id: user.id
                //     }
                // }
                // jwt.sign(payload,config.get("jwtSecret"),{ expiresIn:360000},
                //     (err, token)=>{
                //         if (err) throw err;
                //         res.json({ token });
                        
                //     });
            }
        }
        catch(err){
            console.error(err.message);
            res.status(500).send("server error")
        }
    })

module.exports = router;

