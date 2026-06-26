import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FileText, Search, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Expense } from '../types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function Expenses({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: ExpensesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const filteredExpenses = expenses
    .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownloadExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gastos');

    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Descripción', key: 'description', width: 40 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Monto ($)', key: 'amount', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1A17' } };

    [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(expense => {
      worksheet.addRow({
        date: expense.date,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
      });
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell('amount').numFmt = '"$"#,##0.00';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Registro_Gastos_Carniceria.xlsx');
    showToast('Gastos exportados correctamente', 'success');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1c1a17]">Control de Gastos</h1>
          <p className="text-[#878077] text-sm">Registro de egresos operativos</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-5 h-5 text-[#878077] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar gasto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-medium"
            />
          </div>
          
          <button
            onClick={handleDownloadExcel}
            className="flex items-center justify-center gap-2 bg-white border border-[#e8dfd3] text-[#1c1a17] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#fcfaf7] transition-colors"
            title="Exportar a Excel"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#1c1a17] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Gasto</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-[#e8dfd3] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#878077] uppercase bg-[#fcfaf7] border-b border-[#e8dfd3] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Fecha</th>
                <th className="px-6 py-4 font-bold tracking-wider">Descripción</th>
                <th className="px-6 py-4 font-bold tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-bold tracking-wider">Monto</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8dfd3]">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-[#fcfaf7] transition-colors group">
                  <td className="px-6 py-4 font-medium text-[#1c1a17]">
                    {expense.date}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#1c1a17]">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#f0e8dd] text-[#1c1a17]">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-[#1c1a17]">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-[#878077] hover:text-[#1c1a17] hover:bg-[#f0e8dd] transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Está seguro de eliminar este gasto?')) {
                          onDeleteExpense(expense.id);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e8dfd3] text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#878077]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-bold text-[#1c1a17]">No hay gastos registrados</p>
                    <p className="text-sm">No se encontraron gastos que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || editingExpense) && (
          <ExpenseModal
            initialData={editingExpense || undefined}
            onSubmit={(expense) => {
              if (editingExpense) {
                onUpdateExpense(expense);
              } else {
                onAddExpense(expense);
              }
              setIsAdding(false);
              setEditingExpense(null);
            }}
            onClose={() => {
              setIsAdding(false);
              setEditingExpense(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExpenseModalProps {
  initialData?: Expense;
  onSubmit: (expense: Expense) => void;
  onClose: () => void;
}

function ExpenseModal({ initialData, onSubmit, onClose }: ExpenseModalProps) {
  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Expense['category']>(initialData?.category || 'Servicios');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');

  const categories: Expense['category'][] = ['Servicios', 'Proveedores', 'Salarios', 'Mantenimiento', 'Otros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      date,
      description,
      category,
      amount: parseFloat(amount)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#1c1a17]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#fcfaf7] rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-[#e8dfd3]"
      >
        <div className="px-6 py-4 border-b border-[#e8dfd3] flex justify-between items-center bg-white">
          <h2 className="text-xl font-black text-[#1c1a17]">
            {initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <button onClick={onClose} className="text-[#878077] hover:text-[#1c1a17] transition-colors p-2">
            <Trash2 className="w-5 h-5 opacity-0" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Fecha</label>
            <input
              required
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-bold text-[#1c1a17]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Descripción</label>
            <input
              required
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-bold text-[#1c1a17]"
              placeholder="Ej: Pago de luz"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-bold text-[#1c1a17] cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Monto ($)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#e8dfd3] rounded-xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-mono font-bold text-[#1c1a17]"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-[#e8dfd3]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#878077] hover:text-[#1c1a17] hover:bg-[#f0e8dd] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1c1a17] text-white hover:bg-black transition-colors"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
