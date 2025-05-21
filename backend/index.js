const express = require('express');
const { agenda, initAgenda } = require('./services/agenda');
initAgenda();


var cors = require('cors')

const app = express();


const {connectDB} = require("./services/config");
const PORT=8000;

app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
  }));


const productHandler = require("./route/product");
const alertHandler = require("./route/alert");


connectDB("mongodb://127.0.0.1:27017/PriceTracker");

app.listen(PORT,()=>{
    console.log(`Server is listening at PORT: ${PORT}`);
})


app.use('/api/products',productHandler);
app.use('/api/alerts',alertHandler);
