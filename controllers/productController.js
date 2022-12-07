import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';




// Get All Products

export const getProducts = asyncHandler(async (req, res) => {

  
  const pageSize = 6;

    const queryObj = { ...req.query };
    const excludeFields = ["keyword","pageNumber", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Product.find(JSON.parse(queryStr));

    const page =  Number(req.query.pageNumber) || 1 ;
    const limit = req.query.limit ;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.pageNumber) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page does not exists");
    }
    const productCount = await Product.countDocuments();

    const products = await query
    .sort([['_id', 'desc']])
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  // const productsCount = await Product.countDocuments({ ...keyword });
  

  res.json({ products, page , pages: Math.ceil(productCount / pageSize) });
});


// Get Product By ID
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

// Create Product
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    model,
    brand,
    category,
    countInStock,
  } = req.body;

  const product = new Product({
    user: req.user._id,
    name,
    price,
    image,
    model,
    brand,
    category,
    countInStock,
    description,
  });

  const createdProduct = await product.save();

  res.status(201).json(createdProduct);
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    model,
    brand,
    category,
    countInStock,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.model = model;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();

    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// Create product review
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }
    console.log(req.user);

    const review = {
      name: `${req.user.firstName} ${req.user.lastName && req.user.lastName}`,
      avatar: req.user.avatar,
      comment,
      rating: Number(rating),
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// Delete Product
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await product.remove();
    res.json({ message: 'Product Deleted Successfully' });
  } else {
    res.status(400);
    throw new Error('Product not found');
  }
});
