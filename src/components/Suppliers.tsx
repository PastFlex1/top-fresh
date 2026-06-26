import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, Search, Phone, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Supplier } from '../types';
import DeleteConfirmModal from './DeleteConfirmModal';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export default function Suppliers({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }: SuppliersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.contactName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfaf7] rounded-3xl border border-[#e8dfd3]">
      <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black bg-opacity-5 flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#1c1a17]" />
            </div>
            <div>
               <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Proveedores</h1>
               <p className="text-[11px] text-[#878077]">Gestión de socios de abastecimiento</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
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
              Nuevo Proveedor
            </button>
        </div>
      </header>

      <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">

          <AnimatePresence>
          {(isAdding || editingSupplier) && (
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
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <SupplierForm
                  initialData={editingSupplier || undefined}
                  onSubmit={(supplier) => {
                    if (editingSupplier) onUpdateSupplier(supplier);
                    else onAddSupplier(supplier);
                    setIsAdding(false);
                    setEditingSupplier(null);
                  }}
                  onCancel={() => {
                    setIsAdding(false);
                    setEditingSupplier(null);
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
                    <th className="px-6 py-4">Empresa / Contacto</th>
                    <th className="px-6 py-4">Teléfono</th>
                    <th className="px-6 py-4">Categoría principal</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8dfd3]">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-[#f4ece1] rounded-full flex items-center justify-center mr-4">
                             <span className="font-bold text-[#1c1a17] text-sm">{supplier.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 leading-tight">{supplier.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{supplier.contactName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center text-sm text-gray-700">
                             <Phone className="w-3.5 h-3.5 text-gray-400 mr-2" />
                             {supplier.phone}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {supplier.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          supplier.status === 'Activo' ? 'bg-[#d1f4e0] text-[#166534]' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setEditingSupplier(supplier)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setItemToDelete(supplier.id)}
                                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                              No se encontraron proveedores.
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
        title="Eliminar Proveedor"
        message="¿Está seguro de eliminar este proveedor? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (itemToDelete) onDeleteSupplier(itemToDelete);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

function SupplierForm({ initialData, onSubmit, onCancel }: { initialData?: Supplier; onSubmit: (supplier: Supplier) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: initialData?.name || '',
    contactName: initialData?.contactName || '',
    phone: initialData?.phone || '',
    category: initialData?.category || 'General',
    status: initialData?.status || 'Activo',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || Date.now().toString(),
    } as Supplier);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-6 md:p-8 border-b border-[#e8dfd3]">
         <h2 className="text-xl font-bold text-[#1c1a17]">
             {initialData ? 'Editar Proveedor' : 'Añadir Proveedor'}
         </h2>
         <p className="text-sm text-[#878077] mt-1">Ingresa los datos del proveedor o distribuidor.</p>
      </div>
      
      <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Nombre de la Empresa</label>
            <input
                required
                type="text"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            </div>

            <div className="space-y-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Nombre del Contacto</label>
            <input
                required
                type="text"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
            </div>

            <div className="space-y-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Teléfono</label>
            <input
                required
                type="text"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            </div>

            <div className="space-y-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Categoría / Rubro</label>
            <input
                required
                type="text"
                placeholder="Ej. Aves, Res, Cerdos"
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc]"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            </div>

            <div className="space-y-2">
            <label className="text-xs font-bold text-[#878077] uppercase tracking-wide">Estado</label>
            <select
                className="w-full bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cbaefc] appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Activo' | 'Inactivo' })}
            >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
            </select>
            </div>
        </div>
      </div>

      <div className="p-6 md:p-8 border-t border-[#e8dfd3] bg-[#fcfaf7] flex justify-end gap-3 rounded-b-3xl">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full text-sm font-bold text-[#1c1a17] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 rounded-full text-sm font-bold bg-[#1c1a17] text-white hover:bg-black transition-colors cursor-pointer"
        >
          Guardar Proveedor
        </button>
      </div>
    </form>
  );
}
