import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Mail, Phone, Shield, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Seller } from '../types';

interface SellersProps {
  sellers: Seller[];
  onAddSeller: (seller: Seller) => void;
  onUpdateSeller: (seller: Seller) => void;
  onDeleteSeller: (id: string) => void;
}

export default function Sellers({ sellers, onAddSeller, onUpdateSeller, onDeleteSeller }: SellersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSellers = sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cedula.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfaf7] rounded-3xl border border-[#e8dfd3]">
      <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black bg-opacity-5 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1c1a17]" />
            </div>
            <div>
               <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Vendedores y Personal</h1>
               <p className="text-[11px] text-[#878077]">Gestión de Accesos y Empleados</p>
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
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#1c1a17] hover:bg-black text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Añadir Vendedor
            </button>
        </div>
      </header>

      <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-6">

          <AnimatePresence>
          {(isAdding || editingSeller) && (
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
                <SellerForm
                  initialData={editingSeller || undefined}
                  onSubmit={(seller) => {
                    if (editingSeller) onUpdateSeller(seller);
                    else onAddSeller(seller);
                    setIsAdding(false);
                    setEditingSeller(null);
                  }}
                  onCancel={() => {
                    setIsAdding(false);
                    setEditingSeller(null);
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
                    <th className="px-6 py-4">Nombre / Cédula</th>
                    <th className="px-6 py-4">Teléfono</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8dfd3]">
                  {filteredSellers.map(seller => {
                    return (
                      <tr key={seller.id} className="hover:bg-[#fcfaf7] transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random&size=128`} alt={seller.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[#1c1a17]">{seller.name}</span>
                                    <span className="text-[11px] text-[#878077] flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3"/>{seller.cedula}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-[12px] text-[#878077] flex items-center gap-1"><Phone className="w-3 h-3"/>{seller.phone || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 ${seller.role === 'Administrador' ? 'bg-[#cbaefc] text-[#6b21a8]' : 'bg-[#aecbfc] text-[#1d4ed8]'} rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max`}>
                               {seller.role === 'Administrador' && <Shield className="w-3 h-3" />}
                               {seller.role}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${seller.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {seller.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingSeller(seller)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-[#878077] hover:text-[#1c1a17] hover:bg-[#f0e8dd] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if(window.confirm('¿Eliminar este trabajador?')) onDeleteSeller(seller.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-[#878077] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredSellers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#878077] font-medium">
                        No se encontraron trabajadores.
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

interface SellerFormProps {
  initialData?: Seller;
  onSubmit: (s: Seller) => void;
  onCancel: () => void;
}

function SellerForm({ initialData, onSubmit, onCancel }: SellerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [cedula, setCedula] = useState(initialData?.cedula || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [role, setRole] = useState<Seller['role']>(initialData?.role || 'Trabajador');
  const [status, setStatus] = useState<Seller['status']>(initialData?.status || 'Activo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      cedula,
      password,
      phone,
      role,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-1 md:col-span-2 flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-[#1c1a17]">{initialData ? 'Editar Trabajador' : 'Registrar Nuevo Trabajador'}</h3>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Nombre Completo</label>
        <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold" placeholder="Ej: Juan Pérez" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Número de Cédula</label>
        <input type="text" required value={cedula} onChange={e=>setCedula(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold" placeholder="1234567890" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Contraseña</label>
        <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold" placeholder="••••••••" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Teléfono</label>
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-[#fcfaf7] border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold" placeholder="+1234567890" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Rol</label>
            <CustomSelect
              value={role}
              onChange={(v) => setRole(v as any)}
              options={[
                { value: "Trabajador", label: "Trabajador" },
                { value: "Administrador", label: "Administrador" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Estado</label>
            <CustomSelect
              value={status}
              onChange={(v) => setStatus(v as any)}
              options={[
                { value: "Activo", label: "Activo" },
                { value: "Inactivo", label: "Inactivo" }
              ]}
            />
          </div>
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-[#f0e8dd]">
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
            className="absolute z-50 w-full mt-2 bg-white border border-[#e8dfd3] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-1 max-h-52 overflow-y-auto custom-scrollbar"
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
