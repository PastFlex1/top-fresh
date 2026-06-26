import { Product, Sale, Seller, Expense, Supplier, Purchase, Goal } from '../types';

/**
 * CONEXIÓN A LOCALSTORAGE
 * 
 * Se reemplazó la persistencia de Firebase por localStorage para asegurar que los datos
 * se guarden correctamente sin errores de permisos.
 */

// --- API de Productos ---
export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = localStorage.getItem('topfresh_products');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    return [];
  }
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_products', JSON.stringify(products));
  } catch (error) {
    console.error("Error guardando productos:", error);
  }
};

// --- API de Ventas ---
export const getSales = async (): Promise<Sale[]> => {
  try {
    const data = localStorage.getItem('topfresh_sales');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return [];
  }
};

export const saveSales = async (sales: Sale[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_sales', JSON.stringify(sales));
  } catch (error) {
    console.error("Error guardando ventas:", error);
  }
};

// --- API de Vendedores ---
export const getSellers = async (): Promise<Seller[]> => {
  try {
    const data = localStorage.getItem('topfresh_sellers');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo vendedores:", error);
    return [];
  }
};

export const saveSellers = async (sellers: Seller[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_sellers', JSON.stringify(sellers));
  } catch (error) {
    console.error("Error guardando vendedores:", error);
  }
};

// --- API de Gastos ---
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const data = localStorage.getItem('topfresh_expenses');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return [];
  }
};

export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_expenses', JSON.stringify(expenses));
  } catch (error) {
    console.error("Error guardando gastos:", error);
  }
};

// --- API de Proveedores ---
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const data = localStorage.getItem('topfresh_suppliers');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo proveedores:", error);
    return [];
  }
};

export const saveSuppliers = async (suppliers: Supplier[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_suppliers', JSON.stringify(suppliers));
  } catch (error) {
    console.error("Error guardando proveedores:", error);
  }
};

// --- API de Recepciones (Purchases) ---
export const getPurchases = async (): Promise<Purchase[]> => {
  try {
    const data = localStorage.getItem('topfresh_purchases');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo recepciones:", error);
    return [];
  }
};

export const savePurchases = async (purchases: Purchase[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_purchases', JSON.stringify(purchases));
  } catch (error) {
    console.error("Error guardando recepciones:", error);
  }
};

// --- API de Metas ---
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const data = localStorage.getItem('topfresh_goals');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error obteniendo metas:", error);
    return [];
  }
};

export const saveGoals = async (goals: Goal[]): Promise<void> => {
  try {
    localStorage.setItem('topfresh_goals', JSON.stringify(goals));
  } catch (error) {
    console.error("Error guardando metas:", error);
  }
};

