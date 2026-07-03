import { useState, useMemo } from 'react';
import { Search, Receipt, Calendar, User, Clock, FileText, ChevronLeft, ChevronRight, Download, Ban } from 'lucide-react';
import { Sale } from '../types';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import DeleteConfirmModal from './DeleteConfirmModal';

interface HistoryProps {
  sales: Sale[];
  onVoidSale?: (saleId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export default function History({ sales, onVoidSale }: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToVoid, setSaleToVoid] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyClosures, setShowOnlyClosures] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        (sale.sellerName || 'Sistema').toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.date.includes(searchTerm);
      
      let matchesDateRange = true;
      if (startDate || endDate) {
        try {
          const saleDate = new Date(sale.date);
          const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
          const end = endDate ? endOfDay(parseISO(endDate)) : (startDate ? endOfDay(parseISO(startDate)) : new Date(8640000000000000));
          matchesDateRange = isWithinInterval(saleDate, { start, end });
        } catch (e) {
          // Fallback if parsing fails
        }
      }

      const matchesType = showOnlyClosures ? sale.isCashRegisterClose === true : true;

      return matchesSearch && matchesDateRange && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, startDate, endDate, showOnlyClosures]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const currentSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
    setSelectedSale(null);
  }, [searchTerm, startDate, endDate, showOnlyClosures]);

  const handleExportExcel = () => {
    if (filteredSales.length === 0) return;
    
    // Format data for excel
    const excelData = filteredSales.map(sale => {
      const date = new Date(sale.date);
      return {
        'Nº Secuencial': sale.sequenceNumber !== undefined ? `#${String(sale.sequenceNumber).padStart(6, '0')}` : `#${sale.id.substring(0,6).toUpperCase()}`,
        'Estado': sale.status === 'voided' ? 'Anulada' : 'Completada',
        'Fecha': formatInTimeZone(date, 'America/Guayaquil', "dd/MM/yyyy", { locale: es }),
        'Hora': formatInTimeZone(date, 'America/Guayaquil', "HH:mm:ss", { locale: es }),
        'Vendedor': sale.sellerName || 'Sistema',
        'Total ($)': sale.total.toFixed(2),
        'Artículos (Cant.)': sale.items.reduce((sum, item) => sum + item.quantity, 0),
        'Detalle': sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    
    // Auto-size columns
    const maxWidths = excelData.reduce((acc, row) => {
      Object.keys(row).forEach((key, index) => {
        const val = row[key as keyof typeof row] ? row[key as keyof typeof row].toString() : '';
        acc[index] = Math.max(acc[index] || key.length, val.length);
      });
      return acc;
    }, [] as number[]);
    
    worksheet['!cols'] = maxWidths.map(w => ({ width: Math.min(w + 2, 50) })); // Cap width to 50

    const fileName = `Ventas_${startDate || 'Inicio'}_al_${endDate || 'Hoy'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfaf7] rounded-3xl border border-[#e8dfd3]">
      <header className="bg-transparent border-b border-[#e8dfd3] px-6 py-4 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e8dfd3] flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-[#1c1a17]" />
                </div>
                <div>
                   <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Historial de Ventas</h1>
                   <p className="text-[11px] text-[#878077] font-medium tracking-wide uppercase">
                     Total: {filteredSales.length} notas filtradas
                   </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-[#e8dfd3] rounded-full px-3 py-1.5">
                    <Calendar className="w-4 h-4 text-[#878077]" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm font-medium focus:outline-none bg-transparent"
                    />
                    <span className="text-[#878077] text-sm">-</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm font-medium focus:outline-none bg-transparent"
                    />
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#878077]" />
                  <input 
                    type="text" 
                    placeholder="Buscar vendedor..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-[#e8dfd3] rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#cbaefc] w-48 transition-all"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white border border-[#e8dfd3] px-3 py-2 rounded-full hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showOnlyClosures}
                    onChange={(e) => setShowOnlyClosures(e.target.checked)}
                    className="accent-[#cbaefc] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-[#1c1a17]">Solo cierres</span>
                </label>
                <button
                  onClick={handleExportExcel}
                  disabled={filteredSales.length === 0}
                  className="flex items-center gap-2 bg-[#1c1a17] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
            </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Ventas */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col ${selectedSale ? 'hidden lg:flex lg:max-w-md border-r border-[#e8dfd3]' : ''}`}>
          {currentSales.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-[#878077]">
                 <Receipt className="w-12 h-12 mb-4 opacity-50" />
                 <p className="font-bold">No se encontraron ventas</p>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 flex-1 content-start">
                {currentSales.map(sale => {
                  const date = new Date(sale.date);
                  const isSelected = selectedSale?.date === sale.date; // Usar id si se tiene
                  
                  return (
                    <button
                      key={sale.date}
                      onClick={() => setSelectedSale(sale)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-[#1c1a17] border-[#1c1a17] text-white shadow-md' 
                          : 'bg-white border-[#e8dfd3] hover:border-[#cbaefc] hover:shadow-sm text-[#1c1a17]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-widest flex items-center gap-2 ${isSelected ? 'bg-white/20 text-white' : 'bg-[#f0e8dd] text-[#1c1a17]'}`}>
                          {sale.sequenceNumber !== undefined ? `#${String(sale.sequenceNumber).padStart(6, '0')}` : `#${sale.id.substring(0,6).toUpperCase()}`}
                          {sale.isCashRegisterClose && <span className="bg-[#1c1a17] text-white px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase">CIERRE</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-black text-lg leading-none ${sale.status === 'voided' ? 'line-through opacity-50' : ''}`}>
                            ${sale.total.toFixed(2)}
                          </span>
                          {sale.status === 'voided' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Anulada</span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-4 text-xs font-medium mb-1 ${isSelected ? 'text-gray-300' : 'text-[#878077]'}`}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatInTimeZone(date, 'America/Guayaquil', "dd MMM yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatInTimeZone(date, 'America/Guayaquil', "HH:mm:ss", { locale: es })}</span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs font-medium ${isSelected ? 'text-gray-300' : 'text-[#878077]'}`}>
                        <User className="w-3.5 h-3.5" />
                        <span>{sale.sellerName || 'Sistema'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-[#e8dfd3] pt-4">
                  <span className="text-sm font-medium text-[#878077]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-full border border-[#e8dfd3] bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#1c1a17]" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-full border border-[#e8dfd3] bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <ChevronRight className="w-4 h-4 text-[#1c1a17]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detalle de Venta */}
        {selectedSale && (
          <div className="flex-[2] bg-[#fcfaf7] flex flex-col overflow-hidden relative">
            <button 
              onClick={() => setSelectedSale(null)}
              className="lg:hidden absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-[#e8dfd3] shadow-sm"
            >
              ✕
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-2xl mx-auto bg-white border border-[#e8dfd3] rounded-3xl p-8 shadow-sm">
                <div className="text-center mb-8 pb-8 border-b border-dashed border-[#e8dfd3]">
                  <div className="w-16 h-16 bg-[#f0e8dd] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-[#1c1a17]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1c1a17] mb-1">
                    {selectedSale.isCashRegisterClose ? 'Cierre de Caja' : 'Nota de Venta'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="inline-block bg-[#1c1a17] text-white px-3 py-1 rounded-full text-sm font-bold tracking-widest">
                      {selectedSale.sequenceNumber !== undefined ? `#${String(selectedSale.sequenceNumber).padStart(6, '0')}` : `#${selectedSale.id.substring(0,6).toUpperCase()}`}
                    </div>
                    {selectedSale.status === 'voided' && (
                      <div className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold tracking-widest border border-red-200 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" />
                        ANULADA
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#878077]">
                    {formatInTimeZone(new Date(selectedSale.date), 'America/Guayaquil', "dd 'de' MMMM, yyyy - HH:mm:ss", { locale: es })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e8dfd3]">
                    <div className="flex items-center gap-2 mb-1 text-[#878077]">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Vendedor</span>
                    </div>
                    <p className="font-bold text-[#1c1a17]">{selectedSale.sellerName || 'Sistema'}</p>
                  </div>
                  <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e8dfd3]">
                    <div className="flex items-center gap-2 mb-1 text-[#878077]">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Método de Pago</span>
                    </div>
                    <p className="font-bold text-[#1c1a17]">
                      {selectedSale.paymentMethod || 'Efectivo'}
                      {selectedSale.receiptNumber && <span className="block text-xs font-medium text-[#878077] mt-0.5">Ref: {selectedSale.receiptNumber}</span>}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-[#1c1a17] text-sm uppercase tracking-wider mb-4 border-b border-[#e8dfd3] pb-2">Artículos</h3>
                  <div className="space-y-4">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-bold text-[#1c1a17]">{item.productName || item.name}</p>
                          <p className="text-sm text-[#878077] font-medium">
                            {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="font-bold text-[#1c1a17]">
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#fcfaf7] rounded-2xl p-6 border border-[#e8dfd3]">
                  <div className="flex justify-between items-center mb-2 text-[#878077]">
                    <span className="font-medium text-sm">Subtotal</span>
                    <span className="font-bold">${selectedSale.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-[#878077] pb-4 border-b border-dashed border-[#e8dfd3]">
                    <span className="font-medium text-sm">IVA (0% RIMPE)</span>
                    <span className="font-bold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-lg text-[#1c1a17] uppercase">Total</span>
                    <span className={`font-black text-3xl tracking-tight ${selectedSale.status === 'voided' ? 'text-red-500 line-through opacity-80' : 'text-[#1c1a17]'}`}>
                      ${selectedSale.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedSale.status !== 'voided' && !selectedSale.isCashRegisterClose && onVoidSale && (
                  <div className="mt-8 pt-6 border-t border-[#e8dfd3] flex justify-end">
                    <button 
                      onClick={() => setSaleToVoid(selectedSale.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Anular Venta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!saleToVoid}
        title="Anular Venta"
        message="¿Estás seguro de anular esta nota de venta? El stock será devuelto al inventario y esta acción no se puede deshacer."
        onConfirm={() => {
          if (saleToVoid && onVoidSale) onVoidSale(saleToVoid);
          setSaleToVoid(null);
        }}
        onCancel={() => setSaleToVoid(null)}
      />
    </div>
  );
}
