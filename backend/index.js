const express = require('express');
const path = require('path')
const { agenda, initAgenda } = require('./services/agenda');
const dotenv = require("dotenv");
dotenv.config();

var cors = require('cors')

const app = express();

const {restrictToLoggedInUserOnly}  = require("./middleware/auth");
const {connectDB} = require("./services/config");

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors({
    origin: process.env.FRONT_END_URL, 
    credentials: true,
  }));


const productHandler = require("./route/product");
const alertHandler = require("./route/alert");
const userHandler = require("./route/user");


connectDB(process.env.MONGODB_CONNECTION_STRING);
initAgenda();

const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`Server is listening at PORT: ${PORT}`);
})

app.get('/', (req, res) => {
  res.status(200).send('Server is awake and running.');
});

app.use('/api/users',userHandler);
app.use('/api/products',restrictToLoggedInUserOnly,productHandler);
app.use('/api/alerts',restrictToLoggedInUserOnly,alertHandler);
