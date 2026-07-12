/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Beef, Search, Bell, User, Home, Mail, ShoppingCart, Store, FileText, LayoutDashboard, History as HistoryIcon, BarChart, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Goal, Product, Sale, Seller, Expense, Supplier, Purchase, Closure } from './types';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Sellers from './components/Sellers';
import History from './components/History';
import Closures from './components/Closures';
import Reports from './components/Reports';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';
import Notifications from './components/Notifications';
import {
  getProducts, getSales, getSellers, getExpenses, getSuppliers, getPurchases, getGoals,
  saveProduct, deleteProduct, saveSale, saveSeller, deleteSeller, saveExpense, deleteExpense,
  saveSupplier, deleteSupplier, savePurchase, saveGoal, saveGoals, hasLocalData, migrateLocalToFirestore,
  saveProducts, saveSellers, saveSuppliers, getClosures, saveClosure, deleteSale
} from './services/api';
import { useToast } from './contexts/ToastContext';

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_SELLERS: Seller[] = [
  { id: '1', name: 'Administrador Principal', cedula: '1234567890', phone: '+1234567890', role: 'Administrador', status: 'Activo', password: 'admin' },
];

const INITIAL_SUPPLIERS: Supplier[] = [];

export default function App() {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Seller | null>(null);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'dashboard' | 'sellers' | 'history' | 'closures' | 'reports' | 'expenses' | 'suppliers' | 'purchases'>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' as const },
    { id: 'pos', label: 'Ventas' as const },
    { id: 'history', label: 'Historial' as const },
    { id: 'closures', label: 'Cierres' as const },
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
  const [closures, setClosures] = useState<Closure[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClosingReminder, setShowClosingReminder] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Carga de datos asíncrona simulando una llamada a API
  useEffect(() => {
    let ignore = false;
    const storedUser = localStorage.getItem('topfresh_auth_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.role === 'Trabajador') {
        setActiveTab('pos');
      }
    } else {
      const storedAuth = localStorage.getItem('topfresh_auth');
      if (storedAuth === 'true') {
        const adminUser: Seller = { id: '1', name: 'Administrador Principal', cedula: '1234567890', phone: '', role: 'Administrador', status: 'Activo' };
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
      }
    }

    const loadData = async () => {
      try {
        const [fetchedProducts, fetchedSales, fetchedSellers, fetchedExpenses, fetchedSuppliers, fetchedPurchases, fetchedGoals, fetchedClosures] = await Promise.all([
          getProducts(),
          getSales(),
          getSellers(),
          getExpenses(),
          getSuppliers(),
          getPurchases(),
          getGoals(),
          getClosures()
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

        // Helper para mapear cierres antiguos al nuevo formato Closure
        const mapSaleToClosure = (sale: any): Closure => {
          if (sale.systemTotal !== undefined && sale.realTotal !== undefined) {
            return sale as Closure;
          }
          const systemCash = sale.items?.find((i: any) => i.productName === 'Total Efectivo' || i.productId === 'cash')?.price ?? sale.total;
          const systemTransfer = sale.items?.find((i: any) => i.productName === 'Total Transferencias' || i.productId === 'transfer')?.price ?? 0;
          const systemTotal = sale.total ?? (systemCash + systemTransfer);
          return {
            id: sale.id,
            date: sale.date,
            sellerName: sale.sellerName || 'Sistema',
            systemCash,
            systemTransfer,
            systemTotal,
            realCash: systemCash,
            realTransfer: systemTransfer,
            realTotal: systemTotal,
            difference: 0,
            status: 'exact'
          };
        };

        // Migración automática de cierres antiguos guardados en la colección 'sales'
        const cleanSales: Sale[] = [];
        const migratedClosures: Closure[] = fetchedClosures.map(mapSaleToClosure);
        
        // Asignar sequenceNumber a los cierres antiguos para que todos tengan números
        migratedClosures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let nextSeq = 1;
        migratedClosures.forEach(c => {
          if (c.sequenceNumber !== undefined) {
            nextSeq = Math.max(nextSeq, c.sequenceNumber + 1);
          }
        });
        for (const c of migratedClosures) {
          if (c.sequenceNumber === undefined) {
            c.sequenceNumber = nextSeq++;
            saveClosure(c).catch(() => {});
          }
        }
        
        for (const sale of fetchedSales) {
          const isClosure = sale.isCashRegisterClose || sale.items?.some((i: any) => i.productId === 'cash' || i.productId === 'transfer' || i.productName === 'Total Efectivo' || i.productName === 'Total Transferencias');
          if (isClosure) {
            try {
              const mapped = mapSaleToClosure(sale);
              await saveClosure(mapped);
              await deleteSale(sale.id);
              if (!migratedClosures.some(c => c.id === mapped.id)) {
                migratedClosures.push(mapped);
              }
            } catch (err) {
              console.error("Error migrando cierre antiguo:", sale.id, err);
              // NOT pushing to cleanSales ensures that even if deletion in Firestore fails, 
              // these closures do not show up as normal sales in the application.
            }
          } else {
            cleanSales.push(sale);
          }
        }

        setSales(cleanSales);
        setClosures(migratedClosures);
        
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

        // if (hasLocalData()) {
        //   setShowMigrationBanner(true);
        // }
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

  // Recordatorio de cierre de caja para trabajadores a las 19:00
  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'Trabajador') return;

    const checkTime = () => {
      const now = new Date();
      const ecuadorTimeZone = 'America/Guayaquil';
      const localHourStr = formatInTimeZone(now, ecuadorTimeZone, 'H');
      const localHour = parseInt(localHourStr, 10);
      
      if (localHour >= 19) {
        const today = formatInTimeZone(now, ecuadorTimeZone, 'yyyy-MM-dd');
        const lastReminder = localStorage.getItem('topfresh_closing_reminder_date');
        if (lastReminder !== today) {
          setShowClosingReminder(true);
          localStorage.setItem('topfresh_closing_reminder_date', today);
        }
      }
    };

    checkTime(); // Check immediately
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);



  const handleLogin = (user: Seller) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('topfresh_auth_user', JSON.stringify(user));
    if (user.role === 'Trabajador') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
    showToast(`Bienvenido(a), ${user.name}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('topfresh_auth_user');
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

  const handleUpdateGoals = async (newGoals: Goal[]) => {
    try {
      await saveGoals(newGoals);
      setGoals(newGoals);
      showToast('Meta mensual actualizada correctamente', 'success');
    } catch (e) {
      showToast('Error al actualizar la meta en la nube', 'error');
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      const keys = [
        'topfresh_products',
        'topfresh_sales',
        'topfresh_sellers',
        'topfresh_expenses',
        'topfresh_suppliers',
        'topfresh_purchases',
        'topfresh_goals'
      ];
      keys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            backupData[key] = JSON.parse(val);
          } catch (e) {
            backupData[key] = val;
          }
        }
      });

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `topfresh_respaldo_local_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Respaldo JSON descargado con éxito', 'success');
    } catch (error) {
      showToast('Error al exportar el respaldo local', 'error');
    }
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    showToast('Iniciando sincronización con la nube...', 'info');
    try {
      const result = await migrateLocalToFirestore();
      if (result.success) {
        // Recargar los datos desde Firestore después de la migración para actualizar la UI
        const [fetchedProducts, fetchedSales, fetchedSellers, fetchedExpenses, fetchedSuppliers, fetchedPurchases, fetchedGoals] = await Promise.all([
          getProducts(),
          getSales(),
          getSellers(),
          getExpenses(),
          getSuppliers(),
          getPurchases(),
          getGoals()
        ]);
        
        setProducts(fetchedProducts);
        setSales(fetchedSales);
        setSellers(fetchedSellers);
        setExpenses(fetchedExpenses);
        setSuppliers(fetchedSuppliers);
        setPurchases(fetchedPurchases);
        setGoals(fetchedGoals);

        setShowMigrationBanner(false);
        showToast('¡Datos migrados a la nube con éxito!', 'success');
      } else {
        showToast('Error en la migración a la nube', 'error');
      }
    } catch (error) {
      console.error("Migration error:", error);
      showToast('Error inesperado durante la migración', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSaleComplete = async (sale: Sale) => {
    const maxSequence = sales.reduce((max, s) => Math.max(max, s.sequenceNumber ?? -1), -1);
    const finalSale = { ...sale, sequenceNumber: maxSequence + 1, status: 'completed' as const };
    
    try {
      await saveSale(finalSale);
      
      // Reduce stock
      const newProducts = products.map(p => {
        const item = sale.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        }
        return p;
      });

      // Update changed products stock in Firestore
      for (const item of sale.items) {
        const updatedProd = newProducts.find(p => p.id === item.productId);
        if (updatedProd) {
          await saveProduct(updatedProd);
        }
      }

      setSales([finalSale, ...sales]);
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
    } catch (e) {
      showToast('Error al registrar la venta en la nube', 'error');
    }
  };

  const handleClosureComplete = async (closure: Closure) => {
    const maxSequence = closures.reduce((max, c) => Math.max(max, c.sequenceNumber ?? -1), -1);
    const finalClosure = { ...closure, sequenceNumber: maxSequence + 1 };

    try {
      await saveClosure(finalClosure);

      // Marcar las ventas del día actual como cerradas (isCashRegisterClose: true)
      const ecuadorTimeZone = 'America/Guayaquil';
      const today = formatInTimeZone(new Date(), ecuadorTimeZone, 'yyyy-MM-dd');
      
      const updatedSales = await Promise.all(sales.map(async (s) => {
        try {
          const saleDate = formatInTimeZone(new Date(s.date), ecuadorTimeZone, 'yyyy-MM-dd');
          if (saleDate === today && s.status !== 'voided' && !s.isCashRegisterClose) {
            const updated = { ...s, isCashRegisterClose: true };
            await saveSale(updated);
            return updated;
          }
        } catch (e) {
          console.error("Error al actualizar estado de cierre en la venta:", s.id, e);
        }
        return s;
      }));

      setSales(updatedSales);
      setClosures([finalClosure, ...closures]);
      showToast('Cierre de caja generado con éxito', 'success');
    } catch (error) {
      console.error("Error guardando cierre:", error);
      showToast('Error al registrar el cierre de caja en la nube', 'error');
    }
  };

  const handleVoidSale = async (saleId: string) => {
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid || saleToVoid.status === 'voided') return;

    try {
      const updatedSale = { ...saleToVoid, status: 'voided' as const };
      await saveSale(updatedSale);

      // Return stock
      const newProducts = products.map(p => {
        const item = saleToVoid.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });

      // Update products stock in Firestore
      for (const item of saleToVoid.items) {
        const updatedProd = newProducts.find(p => p.id === item.productId);
        if (updatedProd) {
          await saveProduct(updatedProd);
        }
      }

      setProducts(newProducts);
      setSales(sales.map(s => s.id === saleId ? updatedSale : s));
      showToast('Venta anulada correctamente', 'warning');
    } catch (e) {
      showToast('Error al anular la venta en la nube', 'error');
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      await saveProduct(product);
      setProducts([...products, product]);
      showToast('Producto agregado con éxito', 'success');
    } catch (e) {
      showToast('Error al agregar el producto a la nube', 'error');
    }
  };

  const handleImportProducts = async (importedProducts: Product[]) => {
    try {
      await saveProducts(importedProducts);
      setProducts([...products, ...importedProducts]);
      showToast(`Se importaron ${importedProducts.length} productos con éxito`, 'success');
    } catch (e) {
      showToast('Error al guardar los productos importados en la nube', 'error');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      await saveProduct(updatedProduct);
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      showToast('Producto actualizado con éxito', 'success');
    } catch (e) {
      showToast('Error al actualizar el producto en la nube', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      showToast('Producto eliminado', 'success');
    } catch (e) {
      showToast('Error al eliminar el producto en la nube', 'error');
    }
  };

  const handleAddSeller = async (seller: Seller) => {
    try {
      await saveSeller(seller);
      setSellers([...sellers, seller]);
      showToast('Trabajador registrado con éxito', 'success');
    } catch (e) {
      showToast('Error al registrar el trabajador en la nube', 'error');
    }
  };

  const handleUpdateSeller = async (updatedSeller: Seller) => {
    try {
      await saveSeller(updatedSeller);
      setSellers(sellers.map(s => s.id === updatedSeller.id ? updatedSeller : s));
      showToast('Datos del trabajador actualizados', 'success');
    } catch (e) {
      showToast('Error al actualizar el trabajador en la nube', 'error');
    }
  };

  const handleDeleteSeller = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers(sellers.filter(s => s.id !== id));
      showToast('Trabajador eliminado', 'success');
    } catch (e) {
      showToast('Error al eliminar el trabajador en la nube', 'error');
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    try {
      await saveExpense(expense);
      setExpenses([...expenses, expense]);
      showToast('Gasto registrado exitosamente', 'success');
    } catch (e) {
      showToast('Error al registrar el gasto en la nube', 'error');
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    try {
      await saveExpense(updatedExpense);
      setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      showToast('Gasto actualizado', 'success');
    } catch (e) {
      showToast('Error al actualizar el gasto en la nube', 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      showToast('Gasto eliminado', 'success');
    } catch (e) {
      showToast('Error al eliminar el gasto en la nube', 'error');
    }
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    try {
      await saveSupplier(supplier);
      setSuppliers([...suppliers, supplier]);
      showToast('Proveedor registrado con éxito', 'success');
    } catch (e) {
      showToast('Error al registrar el proveedor en la nube', 'error');
    }
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    try {
      await saveSupplier(updatedSupplier);
      setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
      showToast('Datos del proveedor actualizados', 'success');
    } catch (e) {
      showToast('Error al actualizar el proveedor en la nube', 'error');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      showToast('Proveedor eliminado', 'success');
    } catch (e) {
      showToast('Error al eliminar el proveedor en la nube', 'error');
    }
  };

  const handleAddPurchase = async (purchase: Purchase, updatedProducts: Product[]) => {
    try {
      await savePurchase(purchase);
      for (const item of purchase.items) {
        const prod = updatedProducts.find(p => p.id === item.productId);
        if (prod) {
          await saveProduct(prod);
        }
      }
      setPurchases([...purchases, purchase]);
      setProducts(updatedProducts);
      showToast(`Llegada de productos: ${purchase.items.length} artículos de ${purchase.supplierName}`, 'success');
    } catch (e) {
      showToast('Error al registrar el ingreso en la nube', 'error');
    }
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
    <div className="bg-[#f0e8dd] text-[#1c1a17] font-sans h-screen w-full flex flex-col overflow-hidden select-none p-2 sm:p-4 2xl:px-6 2xl:py-6 font-medium relative">
      <div className="bg-[#fcfaf7] w-full h-full rounded-2xl sm:rounded-3xl 2xl:rounded-[2.5rem] shadow-lg flex flex-col overflow-hidden border border-[#e8dfd3]">
        {/* Top Navbar */}
        <header className="h-16 2xl:h-20 px-4 2xl:px-8 flex items-center justify-between flex-shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <Beef className="w-6 h-6 text-[#1c1a17]" />
            <span className="font-bold tracking-tight text-xl">Top Fresh</span>
          </div>
          
          <nav className="flex items-center gap-2">
            {(currentUser?.role === 'Trabajador' ? navItems.filter(item => ['pos', 'history', 'closures', 'inventory', 'purchases'].includes(item.id)) : navItems).map(item => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`px-3 py-1.5 2xl:px-6 2xl:py-2 rounded-full text-xs 2xl:text-sm font-semibold transition-all whitespace-nowrap ${
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
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f5f0] rounded-tl-2xl sm:rounded-tl-3xl border-t border-l border-[#e8dfd3] p-3 sm:p-4 2xl:p-6 relative">
          {showMigrationBanner && currentUser?.role === 'Administrador' && (
            <div className="mb-6 p-5 bg-[#fef3c7] border border-[#f59e0b]/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 left-0 h-full w-2 bg-[#f59e0b]" />
              <div className="flex-1">
                <h4 className="text-[#92400e] font-bold text-base flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f59e0b] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f59e0b]"></span>
                  </span>
                  ⚠️ Datos Locales Pendientes de Sincronización
                </h4>
                <p className="text-[#78350f] text-sm mt-1 leading-relaxed">
                  Hemos detectado que esta computadora tiene datos reales guardados localmente. Sincronízalos con la nube para que estén disponibles en otros dispositivos y no se borren.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 self-stretch md:self-auto justify-end">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 text-xs font-bold text-[#78350f] hover:bg-[#fde68a] bg-transparent border border-[#78350f]/20 rounded-xl transition-all cursor-pointer"
                >
                  Descargar Respaldo (.json)
                </button>
                <button
                  onClick={handleMigrateData}
                  disabled={isMigrating}
                  className="px-5 py-2.5 text-xs font-bold bg-[#1c1a17] hover:bg-black disabled:bg-[#1c1a17]/50 text-white rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      Subir a la Nube
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
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
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showClosingReminder && (
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
                  className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#fcaecb]" />
                  <div className="w-16 h-16 bg-[#fcaecb]/20 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-[#e11d48]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1c1a17]">¡Recordatorio!</h3>
                  <p className="text-base text-[#878077] mt-2 mb-6 font-medium">
                    Ya son las 7 de la noche. <br/>
                    <strong className="text-[#1c1a17]">No te olvides de cerrar caja</strong>.
                  </p>
                  
                  <button
                    onClick={() => setShowClosingReminder(false)}
                    className="w-full py-3 bg-[#1c1a17] text-white rounded-xl font-bold hover:bg-black transition-colors shadow-sm"
                  >
                    Entendido
                  </button>
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
                {activeTab === 'pos' && (
                  <POS 
                    products={products} 
                    onCompleteSale={handleSaleComplete} 
                    onCompleteClosure={handleClosureComplete} 
                    currentUser={currentUser} 
                    sales={sales} 
                  />
                )}
                {activeTab === 'inventory' && (
                  <Inventory
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onImportProducts={handleImportProducts}
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
                {activeTab === 'dashboard' && <Dashboard sales={sales} products={products} goals={goals} setGoals={handleUpdateGoals} />}
                {activeTab === 'history' && (
                  <History 
                    sales={currentUser?.role === 'Trabajador' ? sales.filter(s => s.sellerName === currentUser.name) : sales} 
                    onVoidSale={handleVoidSale} 
                  />
                )}
                {activeTab === 'closures' && (
                  <Closures 
                    closures={currentUser?.role === 'Trabajador' ? closures.filter(c => c.sellerName === currentUser.name) : closures} 
                  />
                )}
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
