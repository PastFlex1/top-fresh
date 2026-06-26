/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Beef, Search, Bell, User, Home, Mail, ShoppingCart, Store, FileText, LayoutDashboard, History as HistoryIcon, BarChart, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Goal, Product, Sale, Seller, Expense, Supplier, Purchase } from './types';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Sellers from './components/Sellers';
import History from './components/History';
import Reports from './components/Reports';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';
import Notifications from './components/Notifications';
import { getProducts, getSales, getSellers, getExpenses, getSuppliers, getPurchases, getGoals, saveProducts, saveSales, saveSellers, saveExpenses, saveSuppliers, savePurchases, saveGoals } from './services/api';
import { useToast } from './contexts/ToastContext';

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_SELLERS: Seller[] = [
  { id: '1', name: 'Administrador Principal', cedula: '1234567890', phone: '+1234567890', role: 'Administrador', status: 'Activo', password: 'admin' },
];

const INITIAL_SUPPLIERS: Supplier[] = [];

export default function App() {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'dashboard' | 'sellers' | 'history' | 'reports' | 'expenses' | 'suppliers' | 'purchases'>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' as const },
    { id: 'pos', label: 'Ventas' as const },
    { id: 'history', label: 'Historial' as const },
    { id: 'inventory', label: 'Inventario' as const },
    { id: 'purchases', label: 'Ingresos' as const },
    { id: 'sellers', label: 'Trabajadores' as const },
    { id: 'suppliers', label: 'Proveedores' as const },
    { id: 'expenses', label: 'Gastos' as const },
    { id: 'reports', label: 'Reportes' as const },
  ] as const;
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Carga de datos asíncrona simulando una llamada a API
  useEffect(() => {
    let ignore = false;
    const storedAuth = localStorage.getItem('topfresh_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    const loadData = async () => {
      try {
        const [fetchedProducts, fetchedSales, fetchedSellers, fetchedExpenses, fetchedSuppliers, fetchedPurchases, fetchedGoals] = await Promise.all([
          getProducts(),
          getSales(),
          getSellers(),
          getExpenses(),
          getSuppliers(),
          getPurchases(),
          getGoals()
        ]);

        if (ignore) return;

        if (fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
          const lowStock = fetchedProducts.filter(p => p.stock <= 10);
          if (lowStock.length > 0) {
            setTimeout(() => {
              if (!ignore) showToast(`Atención: Hay ${lowStock.length} producto(s) con stock crítico`, 'warning');
            }, 1500);
          }
        } else {
          setProducts(INITIAL_PRODUCTS);
          await saveProducts(INITIAL_PRODUCTS); // Inicializar DB
        }

        setSales(fetchedSales);
        
        if (fetchedSellers.length > 0) {
          setSellers(fetchedSellers);
        } else {
          setSellers(INITIAL_SELLERS);
          await saveSellers(INITIAL_SELLERS); // Inicializar DB
        }

        setExpenses(fetchedExpenses);

        if (fetchedSuppliers.length > 0) {
          setSuppliers(fetchedSuppliers);
        } else {
          setSuppliers(INITIAL_SUPPLIERS);
          await saveSuppliers(INITIAL_SUPPLIERS); // Inicializar DB
        }
        
        setPurchases(fetchedPurchases);
        setGoals(fetchedGoals);

      } catch (error) {
        console.error("Error cargando base de datos", error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Simulación de guardado asíncrono
  // En una API real, esto se llamaría directamente al crear/editar/eliminar
  useEffect(() => {
    if (isDataLoaded) saveProducts(products);
  }, [products, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) saveSales(sales);
  }, [sales, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) saveSellers(sellers);
  }, [sellers, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) saveExpenses(expenses);
  }, [expenses, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) saveSuppliers(suppliers);
  }, [suppliers, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) savePurchases(purchases);
  }, [purchases, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) saveGoals(goals);
  }, [goals, isDataLoaded]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('topfresh_auth', 'true');
    showToast('Sesión iniciada correctamente', 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('topfresh_auth');
    showToast('Sesión cerrada', 'success');
  };

  const handleTabChange = (id: typeof activeTab) => {
    if (activeTab === id) return;
    setIsNavigating(true);
    setTimeout(() => {
      setActiveTab(id);
      setIsNavigating(false);
    }, 400); // Simulated network load for modules
  };

  const handleSaleComplete = (sale: Sale) => {
    const maxSequence = sales.reduce((max, s) => Math.max(max, s.sequenceNumber ?? -1), -1);
    const finalSale = { ...sale, sequenceNumber: maxSequence + 1, status: 'completed' as const };
    setSales([finalSale, ...sales]);
    // Reduce stock
    const newProducts = products.map(p => {
      const item = sale.items.find(i => i.productId === p.id);
      if (item) {
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      }
      return p;
    });
    setProducts(newProducts);
    showToast('Venta completada con éxito', 'success');

    // Notify if stock gets low
    sale.items.forEach(item => {
      const originalProduct = products.find(p => p.id === item.productId);
      const newProduct = newProducts.find(p => p.id === item.productId);
      if (originalProduct && newProduct && originalProduct.stock > 10 && newProduct.stock <= 10) {
        showToast(`Stock bajo: ${newProduct.name} (${newProduct.stock} ${newProduct.unit})`, 'warning');
      }
    });
  };

  const handleVoidSale = (saleId: string) => {
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid || saleToVoid.status === 'voided') return;

    // Return stock
    const newProducts = products.map(p => {
      const item = saleToVoid.items.find(i => i.productId === p.id);
      if (item) {
        return { ...p, stock: p.stock + item.quantity };
      }
      return p;
    });
    setProducts(newProducts);

    // Update sale status
    setSales(sales.map(s => s.id === saleId ? { ...s, status: 'voided' } : s));
    showToast('Venta anulada correctamente', 'warning');
  };

  const handleAddProduct = (product: Product) => {
    setProducts([...products, product]);
    showToast('Producto agregado con éxito', 'success');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    showToast('Producto actualizado con éxito', 'success');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    showToast('Producto eliminado', 'success');
  };

  const handleAddSeller = (seller: Seller) => {
    setSellers([...sellers, seller]);
    showToast('Trabajador registrado con éxito', 'success');
  };

  const handleUpdateSeller = (updatedSeller: Seller) => {
    setSellers(sellers.map(s => s.id === updatedSeller.id ? updatedSeller : s));
    showToast('Datos del trabajador actualizados', 'success');
  };

  const handleDeleteSeller = (id: string) => {
    setSellers(sellers.filter(s => s.id !== id));
    showToast('Trabajador eliminado', 'success');
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
    showToast('Gasto registrado exitosamente', 'success');
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    showToast('Gasto actualizado', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    showToast('Gasto eliminado', 'success');
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers([...suppliers, supplier]);
    showToast('Proveedor registrado con éxito', 'success');
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    showToast('Datos del proveedor actualizados', 'success');
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
    showToast('Proveedor eliminado', 'success');
  };

  const handleAddPurchase = (purchase: Purchase, updatedProducts: Product[]) => {
    setPurchases([...purchases, purchase]);
    setProducts(updatedProducts);
    showToast(`Llegada de productos: ${purchase.items.length} artículos de ${purchase.supplierName}`, 'success');
  };

  if (!isDataLoaded) {
    return (
      <div className="bg-[#f0e8dd] h-screen w-full flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#cbaefc]/20 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center relative z-10 flex flex-col items-center bg-[#fcfaf7] p-12 rounded-[2.5rem] shadow-xl border border-[#e8dfd3]"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-[#1c1a17] rounded-3xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-[#cbaefc]/40 to-transparent"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Beef className="w-10 h-10 text-white relative z-10" />
          </motion.div>
          
          <h2 className="text-[#1c1a17] font-black text-2xl tracking-tight mb-2">Preparando Sistema</h2>
          
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className="w-4 h-4 text-[#878077] animate-spin" />
            <p className="text-[#878077] font-medium text-sm">Cargando base de datos...</p>
          </div>
          
          {/* Progress bar simulation */}
          <div className="w-full h-1.5 bg-[#e8dfd3] rounded-full mt-6 overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-[#1c1a17] rounded-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} sellers={sellers} />;
  }

  return (
    <div className="bg-[#f0e8dd] text-[#1c1a17] font-sans h-screen w-full flex flex-col overflow-hidden select-none px-6 py-6 font-medium relative">
      <div className="bg-[#fcfaf7] w-full h-full rounded-[2.5rem] shadow-lg flex flex-col overflow-hidden border border-[#e8dfd3]">
        {/* Top Navbar */}
        <header className="h-20 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Beef className="w-6 h-6 text-[#1c1a17]" />
            <span className="font-bold tracking-tight text-xl">Top Fresh</span>
          </div>
          
          <nav className="flex items-center gap-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === item.id 
                    ? 'bg-white shadow-sm text-[#1c1a17]' 
                    : 'text-[#878077] hover:text-[#1c1a17] hover:bg-[#f6f2eb]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Notifications products={products} purchases={purchases} />
            <button onClick={() => setShowLogoutConfirm(true)} className="w-10 h-10 rounded-full bg-[#d7ccc0] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden hover:bg-[#cbbbad] transition-colors" title="Cerrar sesión">
               <User className="w-5 h-5 text-white mt-1" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f5f0] rounded-tl-3xl border-t border-l border-[#e8dfd3] p-6 lg:p-8 relative">
          
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#1c1a17] bg-opacity-40 backdrop-blur-sm z-[99] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-[#fcaecb]/20 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-[#e11d48]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1c1a17]">¿Estás seguro de cerrar sesión?</h3>
                  <p className="text-sm text-[#878077] mt-2 mb-6">Tendrás que volver a ingresar tus credenciales para acceder al sistema.</p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl font-bold text-[#1c1a17] hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        handleLogout();
                      }}
                      className="flex-1 py-3 bg-[#e11d48] text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isNavigating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center bg-[#f8f5f0] z-50"
              >
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-[#1c1a17] animate-spin mb-4" />
                  <p className="text-[#878077] font-medium text-sm">Cargando módulo...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {activeTab === 'pos' && <POS products={products} onCompleteSale={handleSaleComplete} />}
                {activeTab === 'inventory' && (
                  <Inventory
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                )}
                {activeTab === 'sellers' && (
                  <Sellers
                    sellers={sellers}
                    onAddSeller={handleAddSeller}
                    onUpdateSeller={handleUpdateSeller}
                    onDeleteSeller={handleDeleteSeller}
                  />
                )}
                {activeTab === 'expenses' && (
                  <Expenses
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                )}
                {activeTab === 'suppliers' && (
                  <Suppliers 
                    suppliers={suppliers} 
                    onAddSupplier={handleAddSupplier}
                    onUpdateSupplier={handleUpdateSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                  />
                )}
                {activeTab === 'purchases' && (
                  <Purchases
                    purchases={purchases}
                    products={products}
                    suppliers={suppliers}
                    onAddPurchase={handleAddPurchase}
                  />
                )}
                {activeTab === 'dashboard' && <Dashboard sales={sales} products={products} goals={goals} setGoals={setGoals} />}
                {activeTab === 'history' && <History sales={sales} onVoidSale={handleVoidSale} />}
                {activeTab === 'reports' && <Reports sales={sales} products={products} expenses={expenses} />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <div className="absolute bottom-1.5 inset-x-0 text-center pointer-events-none">
        <span className="text-[9px] text-[#a8a198] uppercase tracking-widest font-bold">
          Desarrollado por Palma Nexus Solutions 2026
        </span>
      </div>
    </div>
  );
}
