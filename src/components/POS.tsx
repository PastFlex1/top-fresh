import React, { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ShoppingCart, Plus, Trash2, Receipt, Search, AlertCircle, X, Check, Lock } from 'lucide-react';
import { Product, CartItem, Sale, Seller, Closure } from '../types';

interface POSProps {
  products: Product[];
  sales?: Sale[];
  currentUser?: Seller | null;
  onCompleteSale: (sale: Sale) => void;
  onCompleteClosure: (closure: Closure) => void;
}

export default function POS({ products, onCompleteSale, onCompleteClosure, sales = [], currentUser = null }: POSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [realCashInput, setRealCashInput] = useState('');
  const [realTransferInput, setRealTransferInput] = useState('');
  const [calculatedCash, setCalculatedCash] = useState(0);
  const [calculatedTransfer, setCalculatedTransfer] = useState(0);

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
    };
    if (paymentMethod === 'Transferencia') {
      newSale.receiptNumber = receiptNumber;
    }
    onCompleteSale(newSale);
    setCart([]);
    setReceiptNumber('');
    setAmountReceived('');
  };

  const handleCashRegisterClose = () => {
    const ecuadorTimeZone = 'America/Guayaquil';
    const today = formatInTimeZone(new Date(), ecuadorTimeZone, 'yyyy-MM-dd');
    
    const todaysSales = sales.filter(s => {
      try {
        const saleDate = formatInTimeZone(new Date(s.date), ecuadorTimeZone, 'yyyy-MM-dd');
        return (
          saleDate === today && 
          s.status !== 'voided' && 
          !s.isCashRegisterClose
        );
      } catch (e) {
        return false;
      }
    });
    
    if (todaysSales.length === 0) {
      setToastMessage('No hay ventas hoy para cerrar caja.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const totalCash = todaysSales.filter(s => s.paymentMethod === 'Efectivo' || !s.paymentMethod).reduce((sum, s) => sum + s.total, 0);
    const totalTransfer = todaysSales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + s.total, 0);

    setCalculatedCash(totalCash);
    setCalculatedTransfer(totalTransfer);
    setRealCashInput('');
    setRealTransferInput('');
    setIsClosingModalOpen(true);
  };

  const handleConfirmClosure = () => {
    const realCash = parseFloat(realCashInput) || 0;
    const realTransfer = parseFloat(realTransferInput) || 0;
    const realTotal = realCash + realTransfer;
    const systemTotal = calculatedCash + calculatedTransfer;
    const difference = realTotal - systemTotal;

    // Determine status
    let status: 'exact' | 'warning' | 'mismatch' = 'exact';
    const absDiff = Math.abs(difference);
    if (absDiff > 0 && absDiff <= 2) {
      status = 'warning';
    } else if (absDiff > 2) {
      status = 'mismatch';
    }

    const closure: Closure = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      sellerName: currentUser?.name || 'Sistema',
      systemCash: calculatedCash,
      systemTransfer: calculatedTransfer,
      systemTotal,
      realCash,
      realTransfer,
      realTotal,
      difference,
      status
    };

    onCompleteClosure(closure);
    setIsClosingModalOpen(false);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex-1 flex overflow-hidden rounded-2xl 2xl:rounded-3xl h-full gap-3 2xl:gap-6">
      {/* Products Section */}
      <div className="flex-[3] flex flex-col bg-[#fcfaf7] overflow-hidden rounded-2xl 2xl:rounded-3xl border border-[#e8dfd3]">
        <header className="h-14 2xl:h-[72px] bg-transparent border-b border-[#e8dfd3] px-4 2xl:px-6 flex items-center justify-between flex-shrink-0">
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

        <div className="p-3 2xl:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 2xl:gap-4">
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
      <div className="w-[280px] 2xl:w-[340px] bg-[#fcfaf7] flex flex-col rounded-2xl 2xl:rounded-3xl border border-[#e8dfd3] shadow-sm flex-shrink-0 overflow-hidden">
        <div className="p-4 2xl:p-5 border-b border-[#e8dfd3] bg-white flex justify-between items-center">
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

        <div className="p-4 2xl:p-5 bg-white border-t border-[#e8dfd3]">
          <div className="mb-3 2xl:mb-4">
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
          
          {paymentMethod === 'Efectivo' && cart.length > 0 && (
            <div className="bg-[#f0e8dd] rounded-xl p-3 mb-5 border border-[#d7ccc0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#878077] uppercase tracking-wider">Monto Recibido</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#1c1a17] font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full bg-white border border-[#e8dfd3] rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc] font-bold text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#d7ccc0] border-dashed">
                <span className="text-xs font-bold text-[#878077] uppercase tracking-wider">Cambio</span>
                <span className={`font-black text-xl tracking-tight ${
                  (parseFloat(amountReceived) || 0) >= total && amountReceived !== '' ? 'text-green-600' : 'text-[#878077]'
                }`}>
                  ${Math.max(0, (parseFloat(amountReceived) || 0) - total).toFixed(2)}
                </span>
              </div>
            </div>
          )}
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

      {/* Modal de Cierre de Caja con Cuadre */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 bg-[#1c1a17] bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#e8dfd3] shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#e8dfd3]">
              <h2 className="text-xl font-black text-[#1c1a17] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#cbaefc]" />
                Cuadre de Cierre de Caja
              </h2>
              <button 
                onClick={() => setIsClosingModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-[#878077]" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Resumen del Sistema */}
              <div className="bg-[#fcfaf7] rounded-2xl p-4 border border-[#e8dfd3]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#878077] mb-3">Ventas Calculadas por el Sistema</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-[#878077]">Efectivo Esperado</span>
                    <span className="text-lg font-extrabold text-[#1c1a17] font-mono">${calculatedCash.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#878077]">Transferencias Esperadas</span>
                    <span className="text-lg font-extrabold text-[#1c1a17] font-mono">${calculatedTransfer.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-dashed border-[#e8dfd3] flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-[#1c1a17]">Total en Sistema</span>
                  <span className="text-xl font-black text-[#1c1a17] font-mono">${(calculatedCash + calculatedTransfer).toFixed(2)}</span>
                </div>
              </div>

              {/* Entradas del Usuario */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#878077]">Monto Real en Caja / Banco</h3>
                <div>
                  <label className="block text-xs font-bold text-[#1c1a17] mb-1">Efectivo Físico en Caja ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={realCashInput}
                    onChange={(e) => setRealCashInput(e.target.value)}
                    className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1c1a17] mb-1">Transferencias Reales en Banco ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={realTransferInput}
                    onChange={(e) => setRealTransferInput(e.target.value)}
                    className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                  />
                </div>
              </div>

              {/* Diferencia y Cuadre */}
              {(() => {
                const rCash = parseFloat(realCashInput) || 0;
                const rTransfer = parseFloat(realTransferInput) || 0;
                const rTotal = rCash + rTransfer;
                const sTotal = calculatedCash + calculatedTransfer;
                const diff = rTotal - sTotal;

                let badgeColor = 'bg-green-50 text-green-700 border-green-200';
                let statusText = 'Caja Cuadrada (Monto Exacto)';
                const absDiff = Math.abs(diff);

                if (absDiff > 0 && absDiff <= 2) {
                  badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  statusText = `Diferencia de Tolerancia ($${diff.toFixed(2)})`;
                } else if (absDiff > 2) {
                  badgeColor = 'bg-red-50 text-red-700 border-red-200';
                  statusText = `Descuadre de Caja ($${diff.toFixed(2)})`;
                }

                return (
                  <div className={`p-4 rounded-2xl border ${badgeColor} flex flex-col items-center justify-center text-center transition-all`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1">Resultado del Cuadre</span>
                    <span className="text-sm font-black uppercase leading-tight mb-1">{statusText}</span>
                    <div className="flex gap-4 text-xs font-bold mt-1 opacity-90">
                      <span>Total Real: <span className="font-mono">${rTotal.toFixed(2)}</span></span>
                      <span>Diferencia: <span className="font-mono">${diff >= 0 ? '+' : ''}${diff.toFixed(2)}</span></span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsClosingModalOpen(false)}
                  className="flex-1 bg-white border border-[#e8dfd3] hover:bg-[#fcfaf7] text-[#878077] font-bold py-3 rounded-2xl transition-colors text-sm cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleConfirmClosure}
                  className="flex-1 bg-[#1c1a17] hover:bg-black text-white font-bold py-3 rounded-2xl transition-colors text-sm cursor-pointer"
                >
                  CONFIRMAR CIERRE
                </button>
              </div>
            </div>
          </div>
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
