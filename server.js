const bodyParser = require("body-parser");
const express = require("express")
const app = express()
const db = require("./config/db")
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

// connect DB
db();

// init Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(express.json({ extended: false })) //it allow us to do get data from req.body or we can use reqbodyparser.json()

const options = {
    definition: {
        openapi : "3.0.0",
        info: {
            title: "Exiercise API",
            version: "1.0.0",
            description: "A simple Express library API"
        },
        components: {
            securitySchemes:{
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        servers: [
            {
                url: "http://localhost:9000",
                description: 'start the server'
            }
        ],
    },
    apis: ["./routes/api/*.js", 
    ]
};

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));


// Define Routes
app.use("/api/signup",require("./routes/api/signup"))
app.use("/api/login",require("./routes/api/login"))
// app.use("/", require("./routes/api/changepassword"))


const PORT = process.env.PORT || 9000

app.listen(PORT,()=>{console.log(`server is started on port ${PORT}`)})
