const Product = require('../model/product');
const {scrapeFullProduct} = require('../services/scraper'); 
const extractASINInfo = require('../services/extractASIN'); 
const {agenda}  = require('../services/agenda');

const handleCheckOrAddProduct = async (req, res) => {
  const { url } = req.body;
  const userId = req.user.id;
  if(!userId) return res.status(404).json({message:"UserId not found"})

  try {
    // 1. Extract asin and domain
    const { asin, domain } = extractASINInfo(url);

    // 2. Check if Product already exists in the DB
    let existingProduct = await Product.findOne({ asin });

    if (existingProduct) {
      // 3. Check if userId is already associated
      const alreadyAdded = existingProduct.userId.some(u => u.customerId.toString() === userId);

      if (!alreadyAdded) {
        existingProduct.userId.push({ customerId: userId });
        await existingProduct.save();
      }

      return res.status(200).json(existingProduct);
    }

    // 4. Scrape title, image, and current price
    const { title, price, image } = await scrapeFullProduct(`https://www.amazon.${domain}/dp/${asin}`);

    // 5. Create and save product
    const newProduct = new Product({
      asin,
      domain,
      title,
      image,
      currentPrice: price,
      priceHistory: [{ price }],
      userId: [{ customerId: userId }],
    });

    const savedProduct = await newProduct.save();

    // 6. Schedule price scraping job
    const job = agenda.create("scrape product price", { productId: savedProduct._id });
    job.repeatEvery("30 minutes");
    await job.save();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error adding product:', err.message);
    res.status(500).json({ error: 'Failed to scrape or save product' });
  }
};




const handleGetProductByuserId = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const data = await Product.findOne({
      _id: productId,
      'userId.customerId': userId
    });

    if (!data) {
      return res.status(404).json({ message: "Product not found or not associated with this user" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const handlefetchAllUserProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    const products = await Product.find({
      userId: {
        $elemMatch: { customerId: userId }
      }
    });

    if (!products) {
      return res.status(404).json({ message: "Product not found or not associated with this user" });
    }

    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};



module.exports=  {handleCheckOrAddProduct,handleGetProductByuserId,handlefetchAllUserProducts};