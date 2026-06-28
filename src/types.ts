export interface Goal {
  id: string;
  month: string; // YYYY-MM
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  unit: string;
  category: 'Aves' | 'Bovinos (Res)' | 'Porcinos (Cerdo)' | 'Ovinos / Caprinos' | 'Embutidos' | 'Vísceras / Menudencias' | 'Preparados / Marinados' | 'Otros';
  imageUrl?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  cost?: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface Sale {
  id: string;
  sequenceNumber?: number;
  status?: 'completed' | 'voided';
  date: string;
  total: number;
  items: CartItem[];
  sellerName?: string;
  paymentMethod?: 'Efectivo' | 'Transferencia' | string;
  receiptNumber?: string;
  isCashRegisterClose?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: 'Servicios' | 'Proveedores' | 'Salarios' | 'Mantenimiento' | 'Otros';
  amount: number;
}

export interface Seller {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  password?: string;
  role: 'Trabajador' | 'Administrador';
  status: 'Activo' | 'Inactivo';
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  category: string;
  status: 'Activo' | 'Inactivo';
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  total: number;
  items: PurchaseItem[];
}
