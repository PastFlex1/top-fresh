import { Product, Sale, Seller, Expense, Supplier, Purchase, Goal, Closure } from '../types';

const API_URL = 'http://localhost:3001/api';

// --- Funciones genéricas ---

async function fetchCollection<T>(collection: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}/${collection}`);
    if (!res.ok) throw new Error('Error fetching data');
    return await res.json();
  } catch (error) {
    console.error(`Error obteniendo ${collection}:`, error);
    return [];
  }
}

async function saveDocument<T extends { id: string }>(collection: string, item: T): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error saving data');
  } catch (error) {
    console.error(`Error guardando ${collection}:`, error);
    throw error;
  }
}

async function saveManyDocuments<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/${collection}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (!res.ok) throw new Error('Error saving batch data');
  } catch (error) {
    console.error(`Error guardando múltiples ${collection}:`, error);
  }
}

async function deleteDocument(collection: string, id: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/${collection}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error deleting data');
  } catch (error) {
    console.error(`Error eliminando ${collection}:`, error);
    throw error;
  }
}

// --- API de Productos ---
export const getProducts = () => fetchCollection<Product>('products');
export const saveProduct = (product: Product) => saveDocument('products', product);
export const deleteProduct = (id: string) => deleteDocument('products', id);
export const saveProducts = (products: Product[]) => saveManyDocuments('products', products);

// --- API de Ventas ---
export const getSales = async (): Promise<Sale[]> => {
  const sales = await fetchCollection<Sale>('sales');
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const saveSale = (sale: Sale) => saveDocument('sales', sale);
export const saveSales = (sales: Sale[]) => saveManyDocuments('sales', sales);
export const deleteSale = (id: string) => deleteDocument('sales', id);

// --- API de Vendedores ---
export const getSellers = () => fetchCollection<Seller>('sellers');
export const saveSeller = (seller: Seller) => saveDocument('sellers', seller);
export const deleteSeller = (id: string) => deleteDocument('sellers', id);
export const saveSellers = (sellers: Seller[]) => saveManyDocuments('sellers', sellers);

// --- API de Gastos ---
export const getExpenses = () => fetchCollection<Expense>('expenses');
export const saveExpense = (expense: Expense) => saveDocument('expenses', expense);
export const deleteExpense = (id: string) => deleteDocument('expenses', id);
export const saveExpenses = (expenses: Expense[]) => saveManyDocuments('expenses', expenses);

// --- API de Proveedores ---
export const getSuppliers = () => fetchCollection<Supplier>('suppliers');
export const saveSupplier = (supplier: Supplier) => saveDocument('suppliers', supplier);
export const deleteSupplier = (id: string) => deleteDocument('suppliers', id);
export const saveSuppliers = (suppliers: Supplier[]) => saveManyDocuments('suppliers', suppliers);

// --- API de Recepciones (Purchases) ---
export const getPurchases = () => fetchCollection<Purchase>('purchases');
export const savePurchase = (purchase: Purchase) => saveDocument('purchases', purchase);
export const savePurchases = (purchases: Purchase[]) => saveManyDocuments('purchases', purchases);

// --- API de Metas ---
export const getGoals = () => fetchCollection<Goal>('goals');
export const saveGoal = (goal: Goal) => saveDocument('goals', goal);
export const saveGoals = (goals: Goal[]) => saveManyDocuments('goals', goals);

// --- API de Cierres de Caja ---
export const getClosures = async (): Promise<Closure[]> => {
  const closures = await fetchCollection<Closure>('closures');
  return closures.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const saveClosure = (closure: Closure) => saveDocument('closures', closure);

// --- API de Sistema ---
export const clearAllData = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/system/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to clear data');
    return await response.json();
  } catch (error) {
    console.error('Error in clearAllData:', error);
    throw error;
  }
};

// --- MIGRACIÓN DE LOCALSTORAGE A SQLITE (Aún útil para primera carga) ---

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
  // Ahora migraremos a la API Local en lugar de Firestore
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
          // Usamos el batch insert que es mucho más rápido
          await saveManyDocuments(item.collectionName, data);
        }
      }
    }

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
    console.error("Error en migración a SQLite:", error);
    return { success: false, error };
  }
};
