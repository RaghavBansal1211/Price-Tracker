const Product = require('../model/product');
const {scrapeFullProduct} = require('../services/scraper'); 
const extractASINInfo = require('../services/extractASIN'); 
const {agenda}  = require('../services/agenda');

const handleCheckOrAddProduct = async (req, res) => {
  const { url } = req.body;

  try {
    // Extract asin and domain
    const { asin, domain } = extractASINInfo(url);

    // Check if Product already exists in the DB
    const existingProduct  = await Product.findOne({asin:asin});
    if(existingProduct){
      return res.status(200).json(existingProduct);
    }
    
    // Scrape title, image, and current price
    const { title, price, image } = await scrapeFullProduct(`https://www.amazon.${domain}/dp/${asin}`);

    // Create and save product
    const newProduct = new Product({
      url,
      asin,
      domain,
      title,
      image,
      currentPrice: price,
      priceHistory: [{ price }],
    });

    const savedProduct = await newProduct.save();
    const job = agenda.create("scrape product price", {productId:savedProduct._id});
    job.repeatEvery("30 minutes");
    job.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error adding product:', err.message);
    res.status(500).json({ error: 'Failed to scrape or save product' });
  }
};

const handleGetProduct = async(req,res) =>{
   const {id} = req.params;
   try{
      const data = await Product.findOne({_id:id});
      if(!data) return res.status(404).json({message:"Product not found"});
      return res.status(200).json(data);
   }
   catch(err){
    return res.status(500).json({message:"Server Error"});
   }
}


module.exports=  {handleCheckOrAddProduct,handleGetProduct};