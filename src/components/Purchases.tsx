import React, { useState } from 'react';
import { PackageOpen, Plus, Trash2, Search, ArrowRight, Save, Truck, PlusCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Purchase, PurchaseItem, Product, Supplier } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Select from 'react-select';

interface PurchasesProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onAddPurchase: (purchase: Purchase, updatedProducts: Product[]) => void;
}

export default function Purchases({ purchases, products, suppliers, onAddPurchase }: PurchasesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = purchases.filter(p => 
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfaf7] rounded-3xl border border-[#e8dfd3]">
      <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1c1a17] bg-opacity-5 flex items-center justify-center">
                <PackageOpen className="w-5 h-5 text-[#1c1a17]" />
            </div>
            <div>
               <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Ingresos de Mercadería</h1>
               <p className="text-[11px] text-[#878077]">Recepciones y compras a proveedores</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar recepción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-[#e8dfd3] shadow-sm rounded-full text-sm focus:ring-2 focus:ring-[#cbaefc] focus:outline-none w-56"
              />
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#1c1a17] hover:bg-black text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Recepción
            </button>
        </div>
      </header>

      <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">

          <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#1c1a17] bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              >
                <PurchaseForm
                  products={products}
                  suppliers={suppliers}
                  onSubmit={(purchase, updatedProducts) => {
                    onAddPurchase(purchase, updatedProducts);
                    setIsAdding(false);
                  }}
                  onCancel={() => setIsAdding(false)}
                />
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>

          <div className="bg-white rounded-3xl border border-[#e8dfd3] shadow-sm overflow-hidden p-2">
            <div className="overflow-x-auto rounded-2xl border border-[#e8dfd3]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-[#fcfaf7]">
                  <tr className="text-[11px] font-bold text-[#878077] uppercase tracking-wider border-b border-[#e8dfd3]">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Proveedor</th>
                    <th className="px-6 py-4">Artículos</th>
                    <th className="px-6 py-4">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8dfd3]">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-gray-900">
                             {format(new Date(purchase.date), "dd MMM yyyy, HH:mm", { locale: es })}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center text-sm font-bold text-gray-900">
                             <Truck className="w-4 h-4 text-gray-400 mr-2" />
                             {purchase.supplierName}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-xs text-gray-600">
                             {purchase.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-bold text-gray-900">
                             ${purchase.total.toFixed(2)}
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                      <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                              No se encontraron recepciones de mercadería.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseForm({ products, suppliers, onSubmit, onCancel }: { products: Product[], suppliers: Supplier[], onSubmit: (purchase: Purchase, updatedProducts: Product[]) => void; onCancel: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');

  const activeProducts = products;
  const activeSuppliers = suppliers.filter(s => s.status === 'Activo');

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId);

  // When a product is selected, optionally auto-fill its previous cost
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = activeProducts.find(p => p.id === id);
    if (prod && prod.cost !== undefined) {
      setCost(prod.cost.toString());
    } else {
      setCost('');
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !cost) return;
    
    const qtyNum = parseFloat(quantity);
    const costNum = parseFloat(cost);
    
    if (qtyNum <= 0 || costNum < 0) return;

    const newItem: PurchaseItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qtyNum,
      cost: costNum,
      subtotal: qtyNum * costNum
    };

    setItems([...items, newItem]);
    
    // Reset inputs
    setSelectedProductId('');
    setQuantity('');
    setCost('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;

    const supplier = activeSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const purchase: Purchase = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      supplierId,
      supplierName: supplier.name,
      total,
      items
    };

    // Calculate updated products stock
    const updatedProducts = products.map(prod => {
      const purchasedItem = items.find(i => i.productId === prod.id);
      if (purchasedItem) {
        return {
          ...prod,
          stock: prod.stock + purchasedItem.quantity,
          cost: purchasedItem.cost // update cost to the latest purchase cost
        };
      }
      return prod;
    });

    onSubmit(purchase, updatedProducts);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
      <div className="p-6 md:p-8 border-b border-[#e8dfd3] flex-shrink-0">
         <h2 className="text-xl font-bold text-[#1c1a17]">
             Nueva Recepción de Mercadería
         </h2>
         <p className="text-sm text-[#878077] mt-1">Registra productos que llegan de los proveedores y actualiza el stock automáticamente.</p>
      </div>
      
      <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
        
        {/* Supplier Selection */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Proveedor</label>
            <select
                required
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc] appearance-none"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
            >
                <option value="" disabled>Selecciona un proveedor</option>
                {activeSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.category}</option>
                ))}
            </select>
        </div>

        {/* Add Item Form */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Agregar Producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Producto</label>
                    <Select
                        className="text-sm"
                        placeholder="Buscar producto..."
                        noOptionsMessage={() => "No se encontraron productos"}
                        value={activeProducts.map(p => ({ value: p.id, label: `${p.name} (${p.category})` })).find(option => option.value === selectedProductId) || null}
                        onChange={(selectedOption) => handleProductSelect(selectedOption ? selectedOption.value : '')}
                        options={activeProducts.map(p => ({
                            value: p.id,
                            label: `${p.name} (${p.category})`
                        }))}
                        isClearable
                        menuPortalTarget={document.body}
                        styles={{
                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                            control: (base) => ({
                                ...base,
                                borderColor: '#e5e7eb', // gray-200
                                borderRadius: '0.5rem', // rounded-lg
                                minHeight: '38px',
                                boxShadow: 'none',
                                '&:hover': {
                                    borderColor: '#cbaefc'
                                }
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? '#1c1a17' : state.isFocused ? '#fcfaf7' : 'white',
                                color: state.isSelected ? 'white' : '#1c1a17',
                                '&:active': {
                                    backgroundColor: '#e8dfd3'
                                }
                            })
                        }}
                    />
                </div>
                
                <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Cantidad {selectedProduct ? `(${selectedProduct.unit})` : ''}</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                    />
                </div>

                <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Costo Unit. ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="0.00"
                    />
                </div>

                <div className="md:col-span-1 flex items-end pb-[2px]">
                    <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedProduct || !quantity || !cost}
                        className="w-full h-9 bg-[#1c1a17] text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        {/* Added Items List */}
        {items.length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-2 font-semibold text-gray-600">Producto</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-right">Cant.</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-right">Costo U.</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-right">Subtotal</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-gray-600">${item.cost.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">${item.subtotal.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">Total:</td>
                            <td className="px-4 py-3 text-right font-bold text-[#1c1a17] text-lg">${total.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}

      </div>

      <div className="p-6 md:p-8 border-t border-[#e8dfd3] bg-[#fcfaf7] flex justify-end gap-3 flex-shrink-0 rounded-b-3xl">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full text-sm font-bold text-[#1c1a17] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!supplierId || items.length === 0}
          className="px-8 py-2.5 rounded-full text-sm font-bold bg-[#1c1a17] text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Recepción
        </button>
      </div>
    </form>
  );
}
