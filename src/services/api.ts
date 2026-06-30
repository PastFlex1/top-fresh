import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Product, Sale, Seller, Expense, Supplier, Purchase, Goal, Closure } from '../types';

// Helper function to recursively remove undefined values from objects before writing to Firestore
const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, removeUndefined(value)])
  );
};

// --- API de Productos ---
export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const list: Product[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Product);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    await setDoc(doc(db, 'products', product.id), removeUndefined(product));
  } catch (error) {
    console.error("Error guardando producto:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    for (const product of products) {
      await saveProduct(product);
    }
  } catch (error) {
    console.error("Error guardando múltiples productos:", error);
  }
};

// --- API de Ventas ---
export const getSales = async (): Promise<Sale[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sales'));
    const list: Sale[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Sale);
    });
    // Sort sales by date descending (newest first) as the app expects
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return [];
  }
};

export const saveSale = async (sale: Sale): Promise<void> => {
  try {
    await setDoc(doc(db, 'sales', sale.id), removeUndefined(sale));
  } catch (error) {
    console.error("Error guardando venta:", error);
    throw error;
  }
};

export const saveSales = async (sales: Sale[]): Promise<void> => {
  try {
    for (const sale of sales) {
      await saveSale(sale);
    }
  } catch (error) {
    console.error("Error guardando múltiples ventas:", error);
  }
};

// --- API de Vendedores ---
export const getSellers = async (): Promise<Seller[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sellers'));
    const list: Seller[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Seller);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo vendedores:", error);
    return [];
  }
};

export const saveSeller = async (seller: Seller): Promise<void> => {
  try {
    await setDoc(doc(db, 'sellers', seller.id), removeUndefined(seller));
  } catch (error) {
    console.error("Error guardando vendedor:", error);
    throw error;
  }
};

export const deleteSeller = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sellers', id));
  } catch (error) {
    console.error("Error eliminando vendedor:", error);
    throw error;
  }
};

export const saveSellers = async (sellers: Seller[]): Promise<void> => {
  try {
    for (const seller of sellers) {
      await saveSeller(seller);
    }
  } catch (error) {
    console.error("Error guardando múltiples vendedores:", error);
  }
};

// --- API de Gastos ---
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    const list: Expense[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Expense);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return [];
  }
};

export const saveExpense = async (expense: Expense): Promise<void> => {
  try {
    await setDoc(doc(db, 'expenses', expense.id), removeUndefined(expense));
  } catch (error) {
    console.error("Error guardando gasto:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    throw error;
  }
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  try {
    for (const expense of expenses) {
      await saveExpense(expense);
    }
  } catch (error) {
    console.error("Error guardando múltiples gastos:", error);
  }
};

// --- API de Proveedores ---
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'suppliers'));
    const list: Supplier[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Supplier);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo proveedores:", error);
    return [];
  }
};

export const saveSupplier = async (supplier: Supplier): Promise<void> => {
  try {
    await setDoc(doc(db, 'suppliers', supplier.id), removeUndefined(supplier));
  } catch (error) {
    console.error("Error guardando proveedor:", error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'suppliers', id));
  } catch (error) {
    console.error("Error eliminando proveedor:", error);
    throw error;
  }
};

export const saveSuppliers = async (suppliers: Supplier[]): Promise<void> => {
  try {
    for (const supplier of suppliers) {
      await saveSupplier(supplier);
    }
  } catch (error) {
    console.error("Error guardando múltiples proveedores:", error);
  }
};

// --- API de Recepciones (Purchases) ---
export const getPurchases = async (): Promise<Purchase[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'purchases'));
    const list: Purchase[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Purchase);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo recepciones:", error);
    return [];
  }
};

export const savePurchase = async (purchase: Purchase): Promise<void> => {
  try {
    await setDoc(doc(db, 'purchases', purchase.id), removeUndefined(purchase));
  } catch (error) {
    console.error("Error guardando recepción:", error);
    throw error;
  }
};

export const savePurchases = async (purchases: Purchase[]): Promise<void> => {
  try {
    for (const purchase of purchases) {
      await savePurchase(purchase);
    }
  } catch (error) {
    console.error("Error guardando múltiples recepciones:", error);
  }
};

// --- API de Metas ---
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'goals'));
    const list: Goal[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Goal);
    });
    return list;
  } catch (error) {
    console.error("Error obteniendo metas:", error);
    return [];
  }
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  try {
    await setDoc(doc(db, 'goals', goal.id), removeUndefined(goal));
  } catch (error) {
    console.error("Error guardando meta:", error);
    throw error;
  }
};

export const saveGoals = async (goals: Goal[]): Promise<void> => {
  try {
    for (const goal of goals) {
      await saveGoal(goal);
    }
  } catch (error) {
    console.error("Error guardando múltiples metas:", error);
  }
};

// --- MIGRACIÓN DE LOCALSTORAGE A FIRESTORE ---

export const hasLocalData = (): boolean => {
  const keys = [
    'topfresh_products',
    'topfresh_sales',
    'topfresh_sellers',
    'topfresh_expenses',
    'topfresh_suppliers',
    'topfresh_purchases',
    'topfresh_goals'
  ];
  return keys.some(key => {
    const val = localStorage.getItem(key);
    if (!val) return false;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
};

export const migrateLocalToFirestore = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    const keys = [
      { key: 'topfresh_products', collectionName: 'products' },
      { key: 'topfresh_sales', collectionName: 'sales' },
      { key: 'topfresh_sellers', collectionName: 'sellers' },
      { key: 'topfresh_expenses', collectionName: 'expenses' },
      { key: 'topfresh_suppliers', collectionName: 'suppliers' },
      { key: 'topfresh_purchases', collectionName: 'purchases' },
      { key: 'topfresh_goals', collectionName: 'goals' }
    ];

    for (const item of keys) {
      const dataStr = localStorage.getItem(item.key);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (Array.isArray(data) && data.length > 0) {
          for (const docData of data) {
            if (docData && docData.id) {
              await setDoc(doc(db, item.collectionName, docData.id), removeUndefined(docData));
            }
          }
        }
      }
    }

    // Crear respaldos renombrados y borrar llaves originales para evitar que aparezca de nuevo el banner
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    for (const item of keys) {
      const dataStr = localStorage.getItem(item.key);
      if (dataStr) {
        localStorage.setItem(`${item.key}_backup_${timestamp}`, dataStr);
        localStorage.removeItem(item.key);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error en migración:", error);
    return { success: false, error };
  }
};

export const getClosures = async (): Promise<Closure[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'closures'));
    const list: Closure[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Closure);
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error obteniendo cierres de caja:", error);
    return [];
  }
};

export const saveClosure = async (closure: Closure): Promise<void> => {
  try {
    await setDoc(doc(db, 'closures', closure.id), removeUndefined(closure));
  } catch (error) {
    console.error("Error guardando cierre de caja:", error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sales', id));
  } catch (error) {
    console.error("Error eliminando venta:", error);
    throw error;
  }
};
