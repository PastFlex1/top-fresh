import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Receipt, Search, AlertCircle, X, Check, Lock } from 'lucide-react';
import { Product, CartItem, Sale, Seller } from '../types';

interface POSProps {
  products: Product[];
  sales?: Sale[];
  currentUser?: Seller | null;
  onCompleteSale: (sale: Sale) => void;
}

export default function POS({ products, onCompleteSale, sales = [], currentUser = null }: POSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [receiptNumber, setReceiptNumber] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product: Product, quantityStr: string) => {
    const quantity = parseFloat(quantityStr);
    if (isNaN(quantity) || quantity <= 0) return;

    if (product.stock <= 0) {
      setToastMessage(`No se puede vender "${product.name}". El stock está agotado, por favor llene el stock.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    const currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty + quantity > product.stock) {
      setToastMessage(`Stock insuficiente para "${product.name}". Solo quedan ${product.stock} ${product.unit}.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        cost: product.cost,
        quantity,
        unit: product.unit,
        subtotal: quantity * product.price
      }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleComplete = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Transferencia' && !receiptNumber.trim()) {
      setToastMessage('Debe ingresar el número de comprobante para la transferencia.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: cart,
      total: cart.reduce((sum, item) => sum + item.subtotal, 0),
      sellerName: currentUser?.name || 'Sistema',
      paymentMethod,
      receiptNumber: paymentMethod === 'Transferencia' ? receiptNumber : undefined,
    };
    onCompleteSale(newSale);
    setCart([]);
    setReceiptNumber('');
  };

  const handleCashRegisterClose = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = sales.filter(s => 
      s.sellerName === (currentUser?.name || 'Sistema') && 
      s.date.startsWith(today) && 
      s.status !== 'voided' && 
      !s.isCashRegisterClose
    );
    
    if (todaysSales.length === 0) {
      setToastMessage('No hay ventas hoy para cerrar caja.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const totalCash = todaysSales.filter(s => s.paymentMethod === 'Efectivo' || !s.paymentMethod).reduce((sum, s) => sum + s.total, 0);
    const totalTransfer = todaysSales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + s.total, 0);
    const total = totalCash + totalTransfer;

    const closeSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [
         { productId: 'cash', productName: 'Total Efectivo', price: totalCash, cost: 0, quantity: 1, unit: 'ud', subtotal: totalCash },
         { productId: 'transfer', productName: 'Total Transferencias', price: totalTransfer, cost: 0, quantity: 1, unit: 'ud', subtotal: totalTransfer },
      ],
      total,
      sellerName: currentUser?.name || 'Sistema',
      isCashRegisterClose: true
    };
    onCompleteSale(closeSale);
    setToastMessage('Cierre de caja generado con éxito.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex-1 flex overflow-hidden rounded-3xl h-full gap-6">
      {/* Products Section */}
      <div className="flex-[3] flex flex-col bg-[#fcfaf7] overflow-hidden rounded-3xl border border-[#e8dfd3]">
        <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-black bg-opacity-5 flex items-center justify-center">
                 <ShoppingCart className="w-5 h-5 text-[#1c1a17]" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Ventas del Día</h1>
                <p className="text-[11px] text-[#878077]">Terminal de Facturación</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCashRegisterClose}
              className="flex items-center gap-2 bg-[#f0e8dd] hover:bg-[#e8dfd3] text-[#1c1a17] px-4 py-2 rounded-full text-sm font-bold border border-[#d7ccc0] shadow-sm transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Cierre de Caja</span>
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-[#e8dfd3] shadow-sm rounded-full text-sm focus:ring-2 focus:ring-[#cbaefc] focus:outline-none w-48 lg:w-[280px]"
              />
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-[#878077]">
              No se encontraron productos.
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-[300px] lg:w-[340px] bg-[#fcfaf7] flex flex-col rounded-3xl border border-[#e8dfd3] shadow-sm flex-shrink-0 overflow-hidden">
        <div className="p-5 border-b border-[#e8dfd3] bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fcaecb] flex items-center justify-center">
                 <ShoppingCart className="w-4 h-4 text-[#be185d]" />
              </div>
              <h2 className="text-md font-bold tracking-tight text-[#1c1a17]">Ticket Actual</h2>
          </div>
          <span className="bg-[#f0e8dd] text-[10px] font-bold px-2 py-1 rounded-full text-[#878077]">
              {cart.length} ÍTEMS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center text-[#878077] py-14 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#f0e8dd] flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-sm font-medium">El ticket está vacío</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.productId} className="flex flex-col bg-white p-3 rounded-2xl border border-[#e8dfd3]">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="font-semibold text-[#1c1a17] text-sm leading-tight flex-1">{item.productName}</span>
                  <button onClick={() => handleRemoveFromCart(item.productId)} className="text-red-300 hover:text-red-500 transition-colors shrink-0 p-1 bg-red-50 rounded-full">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between text-xs text-[#878077] mt-1 items-end">
                  <span className="bg-[#f0e8dd] px-2 py-1 rounded-md font-mono">{item.quantity.toFixed(2)}{item.unit} <span className="mx-1">x</span> ${item.price.toFixed(2)}</span>
                  <span className="font-bold text-[#1c1a17] text-sm">${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-white border-t border-[#e8dfd3]">
          <div className="mb-4">
            <p className="font-medium text-[#878077] text-xs uppercase tracking-wider mb-2">Método de Pago</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('Efectivo')}
                className={`py-2 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'Efectivo' 
                    ? 'border-[#1c1a17] bg-[#1c1a17] text-white' 
                    : 'border-[#e8dfd3] bg-[#fcfaf7] text-[#878077] hover:bg-gray-50'
                }`}
              >
                {paymentMethod === 'Efectivo' && <Check className="w-4 h-4" />}
                Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('Transferencia')}
                className={`py-2 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'Transferencia' 
                    ? 'border-[#1c1a17] bg-[#1c1a17] text-white' 
                    : 'border-[#e8dfd3] bg-[#fcfaf7] text-[#878077] hover:bg-gray-50'
                }`}
              >
                {paymentMethod === 'Transferencia' && <Check className="w-4 h-4" />}
                Transferencia
              </button>
            </div>
            {paymentMethod === 'Transferencia' && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Número de Comprobante"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc] font-medium"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-[#878077] text-xs uppercase tracking-wider">Subtotal</span>
            <span className="font-bold text-[#878077] text-sm tracking-tight">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-[#e8dfd3]">
            <span className="font-medium text-[#878077] text-xs uppercase tracking-wider">IVA (0% RIMPE)</span>
            <span className="font-bold text-[#878077] text-sm tracking-tight">$0.00</span>
          </div>
          <div className="flex justify-between items-end mb-5">
            <span className="font-bold text-[#1c1a17] text-sm uppercase tracking-wider">Total a Pagar</span>
            <span className="font-black text-[#1c1a17] text-3xl tracking-tight leading-none">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleComplete}
            disabled={cart.length === 0 || (paymentMethod === 'Transferencia' && !receiptNumber.trim())}
            className="w-full bg-[#1c1a17] hover:bg-black disabled:bg-[#e8dfd3] disabled:text-[#878077] text-white font-bold py-3.5 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-[0.98] shadow-md text-sm cursor-pointer"
          >
            <Receipt className="w-5 h-5" />
            FINALIZAR VENTA
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50 max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium leading-tight">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-auto text-white/80 hover:text-white p-1 hover:bg-red-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const ProductCard: React.FC<{ product: Product; onAdd: (p: Product, q: string) => void }> = ({ product, onAdd }) => {
  const [quantity, setQuantity] = useState('');

  // Choose pill colors based on category
  let pillColor = 'bg-[#e5e7eb] text-[#374151]'; // Default
  if(product.category === 'Aves') pillColor = 'bg-[#aecbfc] text-[#1d4ed8]';
  if(product.category === 'Bovinos (Res)') pillColor = 'bg-[#fcdcae] text-[#b45309]';
  if(product.category === 'Porcinos (Cerdo)') pillColor = 'bg-[#fcaecb] text-[#be185d]';
  if(product.category === 'Ovinos / Caprinos') pillColor = 'bg-[#d1fae5] text-[#047857]';
  if(product.category === 'Embutidos') pillColor = 'bg-[#cbaefc] text-[#6b21a8]';
  if(product.category === 'Vísceras / Menudencias') pillColor = 'bg-[#fef08a] text-[#a16207]';
  if(product.category === 'Preparados / Marinados') pillColor = 'bg-[#fbcfe8] text-[#be185d]';

  const isIntegerUnit = ['ud', 'paq', 'caja', 'bandeja'].includes(product.unit);

  return (
    <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-sm flex flex-col transition-all hover:shadow-md hover:border-[#cbaefc] overflow-hidden">
      {product.imageUrl && (
        <div className="h-32 w-full bg-[#f0e8dd] shrink-0 border-b border-[#e8dfd3]">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-1 ${pillColor} rounded-full text-[10px] font-bold uppercase tracking-wider`}>{product.category}</span>
          <span className="text-[11px] font-medium text-[#878077] bg-[#f0e8dd] px-2 py-0.5 rounded-md">Stock: {isIntegerUnit ? product.stock : product.stock.toFixed(2)} {product.unit}</span>
        </div>
        <h3 className="font-bold text-[#1c1a17] text-[15px] leading-tight mb-1">{product.name}</h3>
        <p className="text-[#1c1a17] font-black text-lg mb-4">${product.price.toFixed(2)} <span className="text-[11px] font-medium text-[#878077] uppercase">/{product.unit}</span></p>

        <div className="mt-auto flex items-center gap-2 bg-[#f0e8dd] p-1.5 rounded-xl">
        <input
          type="number"
          step={isIntegerUnit ? '1' : '0.01'}
          min={isIntegerUnit ? '1' : '0.01'}
          placeholder={isIntegerUnit ? '0' : '0.00'}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full bg-white border-none shadow-sm rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc] font-mono text-center font-bold"
        />
        <span className="text-[#878077] text-xs font-bold px-1">{product.unit}</span>
        <button
          onClick={() => {
            onAdd(product, quantity);
            setQuantity('');
          }}
          disabled={!quantity || parseFloat(quantity) <= 0}
          className="cursor-pointer bg-[#1c1a17] hover:bg-black disabled:bg-[#d7ccc0] disabled:text-[#f0e8dd] text-white p-2.5 rounded-lg transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      </div>
    </div>
  );
}
