const express = require('express');
const path = require('path')
const { agenda, initAgenda } = require('./services/agenda');
const dotenv = require("dotenv");
dotenv.config();

var cors = require('cors')

const app = express();


const {connectDB} = require("./services/config");


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
  }));


const productHandler = require("./route/product");
const alertHandler = require("./route/alert");
const otpHandler = require("./route/otp");


connectDB(process.env.MONGODB_CONNECTION_STRING);
initAgenda();


app.listen(process.env.PORT,()=>{
    console.log(`Server is listening at PORT: ${process.env.PORT}`);
})


app.use('/api/products',productHandler);
app.use('/api/alerts',alertHandler);
app.use('/api/otp',otpHandler);
