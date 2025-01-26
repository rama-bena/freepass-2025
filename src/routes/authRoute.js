import express from 'express';
import authController from '../controllers/authController.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/register', authController.register);

router.post('/product', async (req, res) => {
  try {
    console.log(req.body);
    const product = new Product(req.body);
    const result = await product.save();
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
    console.log(error.message);
  }
});
export default router;
