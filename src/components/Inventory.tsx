import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Search, Download, ChevronDown, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Product } from '../types';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useToast } from '../contexts/ToastContext';
import DeleteConfirmModal from './DeleteConfirmModal';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportProducts: (products: Product[]) => Promise<void>;
}

export default function Inventory({ products, onAddProduct, onUpdateProduct, onDeleteProduct, onImportProducts }: InventoryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        if (data.length === 0) {
          showToast('El archivo Excel está vacío o no es válido', 'error');
          setIsImporting(false);
          return;
        }

        const importedProducts: Product[] = [];
        const errors: string[] = [];

        const validCategories = [
          'Aves', 'Bovinos (Res)', 'Porcinos (Cerdo)', 'Ovinos / Caprinos', 
          'Embutidos', 'Vísceras / Menudencias', 'Preparados / Marinados', 'Otros'
        ];

        data.forEach((row: any, index: number) => {
          const rowNum = index + 2;
          
          const getValue = (r: any, keys: string[]) => {
            for (const k of keys) {
              if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
                return r[k];
              }
            }
            return undefined;
          };

          const name = getValue(row, ['Producto', 'Name', 'Nombre', 'name', 'producto', 'nombre']);
          const category = getValue(row, ['Categoría', 'Category', 'Categoria', 'category', 'categoría', 'categoria']);
          let stock = getValue(row, ['Stock', 'stock', 'Inventario', 'inventario', 'Cantidad', 'cantidad']);
          const unit = getValue(row, ['Unidad', 'Unit', 'unit', 'unidad', 'Medida', 'medida']);
          const cost = getValue(row, ['Costo', 'Cost', 'cost', 'costo', 'Costo ($)', 'costo ($)']);
          const price = getValue(row, ['Precio', 'Price', 'price', 'precio', 'Precio ($)', 'precio ($)']);

          if (stock === undefined) stock = 0; // Default stock to 0 if not provided

          if (!name) {
            errors.push(`Fila ${rowNum}: Falta el nombre del producto.`);
            return;
          }

          const priceNum = parseFloat(price);
          if (isNaN(priceNum) || priceNum <= 0) {
            errors.push(`Fila ${rowNum} (${name}): El precio debe ser un número mayor a 0.`);
            return;
          }

          let costNum: number | undefined = undefined;
          if (cost !== undefined && cost !== null && cost !== '') {
            costNum = parseFloat(cost);
            if (isNaN(costNum) || costNum < 0) {
              errors.push(`Fila ${rowNum} (${name}): El costo debe ser un número válido.`);
              return;
            }
          }

          const stockNum = parseFloat(stock);
          if (isNaN(stockNum) || stockNum < 0) {
            errors.push(`Fila ${rowNum} (${name}): El stock debe ser un número válido.`);
            return;
          }

          const normalizedCategory = category ? String(category).trim() : 'Otros';
          const matchedCategory = validCategories.find(c => c.toLowerCase() === normalizedCategory.toLowerCase()) || 'Otros';
          const normalizedUnit = unit ? String(unit).trim() : 'ud';

          importedProducts.push({
            id: Math.random().toString(36).substr(2, 9),
            name: String(name).trim(),
            price: priceNum,
            cost: costNum,
            stock: stockNum,
            unit: normalizedUnit,
            category: matchedCategory as any
          });
        });

        if (errors.length > 0) {
          showToast(`Error al importar: ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ' y más...' : ''}`, 'error');
          setIsImporting(false);
          return;
        }

        await onImportProducts(importedProducts);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error(err);
        showToast('Error al procesar el archivo Excel', 'error');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Producto', key: 'name', width: 30 },
      { header: 'Categoría', key: 'category', width: 15 },
      { header: 'Stock', key: 'stock', width: 15 },
      { header: 'Unidad', key: 'unit', width: 10 },
      { header: 'Costo ($)', key: 'cost', width: 15 },
      { header: 'Precio ($)', key: 'price', width: 15 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1C1A17' }, 
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    products.forEach((product, index) => {
      worksheet.addRow({
        id: index + 1,
        name: product.name,
        category: product.category,
        stock: product.stock,
        unit: product.unit,
        cost: product.cost || 0,
        price: product.price,
      });
    });

    // Style data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell('stock').numFmt = '#,##0.00';
        row.getCell('cost').numFmt = '"$"#,##0.00';
        row.getCell('price').numFmt = '"$"#,##0.00';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Inventario_Carniceria.xlsx');
    showToast('Inventario exportado correctamente', 'success');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfaf7] rounded-3xl border border-[#e8dfd3]">
      <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black bg-opacity-5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#1c1a17]" />
            </div>
            <div>
               <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Inventario de Cortes</h1>
               <p className="text-[11px] text-[#878077] font-medium tracking-wide uppercase">
                 Total: {products.length} productos registrados
               </p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-[#e8dfd3] shadow-sm rounded-full text-sm focus:ring-2 focus:ring-[#cbaefc] focus:outline-none w-56"
              />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              accept=".xlsx,.xls" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-white border border-[#e8dfd3] hover:bg-[#f0e8dd] text-[#1c1a17] px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Importar Excel"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{isImporting ? 'Importando...' : 'Importar'}</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="bg-white border border-[#e8dfd3] hover:bg-[#f0e8dd] text-[#1c1a17] px-4 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-sm text-sm cursor-pointer"
              title="Descargar Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#1c1a17] hover:bg-black text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Añadir Producto
            </button>
        </div>
      </header>

      <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">

          <AnimatePresence>
          {(isAdding || editingProduct) && (
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
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              >
                <ProductForm
                  initialData={editingProduct || undefined}
                  onSubmit={(product) => {
                    if (editingProduct) onUpdateProduct(product);
                    else onAddProduct(product);
                    setIsAdding(false);
                    setEditingProduct(null);
                  }}
                  onCancel={() => {
                    setIsAdding(false);
                    setEditingProduct(null);
                  }}
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
                    <th className="px-6 py-4 w-16"></th>
                    <th className="px-6 py-4">Corte / Producto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Stock Actual</th>
                    <th className="px-6 py-4">Costo</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8dfd3]">
                  {filteredProducts.map(product => {
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
                      <tr key={product.id} className="hover:bg-[#fcfaf7] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f0e8dd] flex items-center justify-center shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[#878077] font-bold text-xs">{product.name.charAt(0)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#1c1a17]">{product.name}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 ${pillColor} rounded-full text-[10px] font-bold uppercase tracking-wider`}>{product.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md font-mono font-bold text-xs ${product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-[#f0e8dd] text-[#1c1a17]'}`}>
                            {isIntegerUnit ? product.stock : product.stock.toFixed(2)} {product.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#878077]">{product.cost !== undefined ? `$${product.cost.toFixed(2)}` : '-'}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#1c1a17]">${product.price.toFixed(2)} <span className="text-xs text-[#878077] font-sans font-medium uppercase">/ {product.unit}</span></td>
                        <td className="px-6 py-4 flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-[#878077] hover:text-[#1c1a17] hover:bg-[#f0e8dd] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-[#878077] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#878077] font-medium">
                        No se encontraron cortes o productos en el inventario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        title="Eliminar Producto"
        message="¿Está seguro de eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (itemToDelete) onDeleteProduct(itemToDelete);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (p: Product) => void;
  onCancel: () => void;
}

function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price.toString() || '');
  const [cost, setCost] = useState(initialData?.cost?.toString() || '');
  const [stock, setStock] = useState(initialData?.stock.toString() || '');
  const [category, setCategory] = useState<Product['category']>(initialData?.category || 'Bovinos (Res)');
  const [unit, setUnit] = useState(initialData?.unit || 'kg');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : undefined,
      stock: parseFloat(stock),
      unit,
      category,
      imageUrl
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="col-span-1 md:col-span-2 lg:col-span-6 flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-[#1c1a17]">{initialData ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
      </div>
      
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Nombre</label>
        <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold" placeholder="Ej: Lomo Fino" />
      </div>
      
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Categoría</label>
        <CustomSelect
          value={category}
          onChange={(v) => setCategory(v as any)}
          options={[
            { value: "Aves", label: "Aves" },
            { value: "Bovinos (Res)", label: "Bovinos (Res)" },
            { value: "Porcinos (Cerdo)", label: "Porcinos (Cerdo)" },
            { value: "Ovinos / Caprinos", label: "Ovinos / Caprinos" },
            { value: "Embutidos", label: "Embutidos" },
            { value: "Vísceras / Menudencias", label: "Vísceras / Menudencias" },
            { value: "Preparados / Marinados", label: "Preparados / Marinados" },
            { value: "Otros", label: "Otros" }
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-1">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Costo ($)</label>
        <input type="number" step="0.01" min="0" value={cost} onChange={e=>setCost(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-mono font-bold" placeholder="0.00" />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-1">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Precio de Venta ($)</label>
        <input required type="number" step="0.01" min="0" value={price} onChange={e=>setPrice(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-mono font-bold" placeholder="0.00" />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Stock Inicial</label>
        <div className="flex gap-2">
          <input required type="number" step="0.01" min="0" value={stock} onChange={e=>setStock(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-mono font-bold" placeholder="0.00" />
          <CustomSelect
            value={unit}
            onChange={(v) => setUnit(v)}
            className="w-[120px] shrink-0"
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
              { value: "g", label: "g" },
              { value: "oz", label: "oz" },
              { value: "ud", label: "ud (pieza)" },
              { value: "paq", label: "paq" },
              { value: "caja", label: "caja" },
              { value: "bandeja", label: "bandeja" },
              { value: "l", label: "l" },
              { value: "ml", label: "ml" }
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-6">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Imagen del Producto</label>
        <div className="flex items-center gap-4">
          {imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f0e8dd] shrink-0 border border-[#e8dfd3]">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImageUrl(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }} 
              className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#f0e8dd] file:text-[#1c1a17] hover:file:bg-[#e8dfd3] cursor-pointer" 
            />
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 lg:col-span-6 flex justify-end gap-3 mt-4 pt-4 border-t border-[#f0e8dd]">
        <button type="button" onClick={onCancel} className="cursor-pointer px-6 py-2.5 bg-white border border-[#e8dfd3] text-[#1c1a17] hover:bg-[#fcfaf7] rounded-full font-bold transition-colors text-sm">Cancelar</button>
        <button type="submit" className="cursor-pointer px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-full font-bold transition-colors shadow-md text-sm">Guardar Cambios</button>
      </div>
    </form>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[42px] px-4 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold flex items-center justify-between transition-colors hover:bg-white"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#878077] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 min-w-full whitespace-nowrap mt-2 bg-white border border-[#e8dfd3] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-1 max-h-52 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full block text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#fcfaf7] ${value === opt.value ? 'bg-[#f0e8dd] text-[#1c1a17]' : 'text-[#878077]'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
