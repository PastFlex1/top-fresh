/**
 * EJEMPLO DE ESQUEMAS PARA MONGODB (Mongoose)
 * 
 * Cuando configures tu servidor local (por ejemplo con Node.js y Express),
 * estos serían los modelos que usarías para guardar en MongoDB.
 * 
 * Para usar esto necesitarás instalar mongoose en tu backend:
 * npm install mongoose
 */

/*
import mongoose from 'mongoose';

// 1. Esquema de Producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  unit: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: false }
}, { timestamps: true });

export const ProductModel = mongoose.model('Product', productSchema);


// 2. Esquema de Vendedor / Usuario
const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cedula: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['Administrador', 'Trabajador'], required: true },
  status: { type: String, enum: ['Activo', 'Inactivo'], required: true },
  password: { type: String, required: true } // Recuerda encriptar con bcrypt en el backend real
}, { timestamps: true });

export const SellerModel = mongoose.model('Seller', sellerSchema);


// 3. Esquema de Venta (Ticket)
const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  items: [saleItemSchema],
  total: { type: Number, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  sellerName: { type: String, required: true },
  paymentMethod: { type: String, default: 'Efectivo' }
}, { timestamps: true });

export const SaleModel = mongoose.model('Sale', saleSchema);

*/
