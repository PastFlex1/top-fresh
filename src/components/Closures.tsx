import React, { useState, useMemo } from 'react';
import { Search, Calendar, User, Clock, FileText, ChevronLeft, ChevronRight, Download, Lock, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { Closure } from '../types';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

interface ClosuresProps {
  closures: Closure[];
}

const ITEMS_PER_PAGE = 10;

export default function Closures({ closures }: ClosuresProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClosure, setSelectedClosure] = useState<Closure | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredClosures = useMemo(() => {
    return closures.filter(closure => {
      const matchesSearch = 
        (closure.sellerName || 'Sistema').toLowerCase().includes(searchTerm.toLowerCase()) ||
        closure.date.includes(searchTerm);
      
      let matchesDateRange = true;
      if (startDate || endDate) {
        try {
          const closureDate = new Date(closure.date);
          const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
          const end = endDate ? endOfDay(parseISO(endDate)) : (startDate ? endOfDay(parseISO(startDate)) : new Date(8640000000000000));
          matchesDateRange = isWithinInterval(closureDate, { start, end });
        } catch (e) {
          // Fallback if parsing fails
        }
      }

      return matchesSearch && matchesDateRange;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [closures, searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredClosures.length / ITEMS_PER_PAGE);
  const currentClosures = filteredClosures.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
    setSelectedClosure(null);
  }, [searchTerm, startDate, endDate]);

  const handleExportExcel = () => {
    if (filteredClosures.length === 0) return;
    
    const excelData = filteredClosures.map(c => {
      const date = new Date(c.date);
      let estado = 'Cuadrado';
      if (c.status === 'warning') estado = 'Tolerancia';
      if (c.status === 'mismatch') estado = 'Descuadrado';

      return {
        'Nº Secuencial': c.sequenceNumber !== undefined ? `#${String(c.sequenceNumber).padStart(6, '0')}` : `#${c.id.substring(0,6).toUpperCase()}`,
        'Fecha': formatInTimeZone(date, 'America/Guayaquil', "dd/MM/yyyy", { locale: es }),
        'Hora': formatInTimeZone(date, 'America/Guayaquil', "HH:mm:ss", { locale: es }),
        'Vendedor': c.sellerName || 'Sistema',
        'Efectivo Sistema ($)': c.systemCash.toFixed(2),
        'Efectivo Real ($)': c.realCash.toFixed(2),
        'Transf. Sistema ($)': c.systemTransfer.toFixed(2),
        'Transf. Real ($)': c.realTransfer.toFixed(2),
        'Total Sistema ($)': c.systemTotal.toFixed(2),
        'Total Real ($)': c.realTotal.toFixed(2),
        'Diferencia ($)': c.difference.toFixed(2),
        'Estado': estado
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cierres");
    
    // Auto-size columns
    const maxWidths = excelData.reduce((acc, row) => {
      Object.keys(row).forEach((key, index) => {
        const val = row[key as keyof typeof row] ? row[key as keyof typeof row].toString() : '';
        acc[index] = Math.max(acc[index] || key.length, val.length);
      });
      return acc;
    }, [] as number[]);
    
    worksheet['!cols'] = maxWidths.map(w => ({ width: Math.min(w + 2, 50) }));

    const fileName = `Cierres_${startDate || 'Inicio'}_al_${endDate || 'Hoy'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex-1 flex overflow-hidden rounded-3xl h-full gap-6">
      {/* Closures Main Section */}
      <div className="flex-[3] flex flex-col bg-[#fcfaf7] overflow-hidden rounded-3xl border border-[#e8dfd3]">
        <header className="h-[72px] bg-transparent border-b border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black bg-opacity-5 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#1c1a17]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1c1a17] leading-tight">Cierres de Caja</h1>
              <p className="text-[11px] text-[#878077] font-medium tracking-wide uppercase">
                Historial de Arqueos de Caja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador y Filtros */}
            <div className="flex items-center gap-2 bg-white border border-[#e8dfd3] px-3 py-1.5 rounded-full shadow-sm text-[#878077]">
              <Calendar className="w-4 h-4 text-[#878077]" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="text-xs font-semibold focus:outline-none bg-transparent"
              />
              <span className="text-xs text-gray-300 font-bold">|</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="text-xs font-semibold focus:outline-none bg-transparent"
              />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#878077]" />
              <input 
                type="text" 
                placeholder="Buscar vendedor..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[#e8dfd3] rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#cbaefc] w-48 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={handleExportExcel}
              disabled={filteredClosures.length === 0}
              className="flex items-center gap-2 bg-[#1c1a17] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </header>

        {/* Table View */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {currentClosures.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#878077]">
              <Lock className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-bold">No se encontraron cierres de caja</p>
            </div>
          ) : (
            <div className="bg-white border border-[#e8dfd3] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfaf7] border-b border-[#e8dfd3] text-[#878077] text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Nº Cierre</th>
                    <th className="px-6 py-4">Fecha / Hora</th>
                    <th className="px-6 py-4">Vendedor</th>
                    <th className="px-6 py-4 text-right">Sistema</th>
                    <th className="px-6 py-4 text-right">Real</th>
                    <th className="px-6 py-4 text-right">Diferencia</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8dfd3] text-sm text-[#1c1a17]">
                  {currentClosures.map(c => {
                    const date = new Date(c.date);
                    const isSelected = selectedClosure?.id === c.id;
                    
                    let badgeColor = '';
                    let statusLabel = '';
                    
                    if (c.status === 'exact') {
                      badgeColor = 'bg-green-50 text-green-700 border-green-200';
                      statusLabel = 'Cuadrado';
                    } else if (c.status === 'warning') {
                      badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                      statusLabel = 'Tolerancia';
                    } else {
                      badgeColor = 'bg-red-50 text-red-700 border-red-200';
                      statusLabel = 'Descuadre';
                    }

                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedClosure(c)}
                        className={`cursor-pointer transition-colors hover:bg-[#fcfaf7] ${isSelected ? 'bg-[#f0e8dd]' : ''}`}
                      >
                        <td className="px-6 py-4 font-mono font-bold">
                          {c.sequenceNumber !== undefined ? `#${String(c.sequenceNumber).padStart(6, '0')}` : `#${c.id.substring(0,6).toUpperCase()}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className="block font-medium">
                            {formatInTimeZone(date, 'America/Guayaquil', "dd MMM yyyy", { locale: es })}
                          </span>
                          <span className="text-xs text-[#878077]">
                            {formatInTimeZone(date, 'America/Guayaquil', "HH:mm:ss", { locale: es })}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold">{c.sellerName}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold">${c.systemTotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold">${c.realTotal.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-mono font-black ${c.difference > 0 ? 'text-green-600' : c.difference < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                          {c.difference >= 0 ? '+' : ''}{c.difference.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${badgeColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <footer className="h-16 border-t border-[#e8dfd3] px-6 flex items-center justify-between flex-shrink-0 bg-transparent">
            <span className="text-sm font-medium text-[#878077]">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-[#e8dfd3] bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 text-[#1c1a17]" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full border border-[#e8dfd3] bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4 text-[#1c1a17]" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Closure Detail Panel */}
      {selectedClosure && (
        <div className="flex-[2] bg-white border border-[#e8dfd3] rounded-3xl flex flex-col overflow-hidden shadow-lg relative max-w-md">
          <button 
            onClick={() => setSelectedClosure(null)}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-[#e8dfd3] shadow-sm hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-[#878077]" />
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="text-center mb-6 pb-6 border-b border-dashed border-[#e8dfd3]">
              <div className="w-14 h-14 bg-[#f0e8dd] rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[#1c1a17]" />
              </div>
              <h2 className="text-lg font-black text-[#1c1a17] mb-1">Detalle del Arqueo</h2>
              <div className="inline-block bg-[#1c1a17] text-white px-3 py-0.5 rounded-full text-xs font-bold tracking-widest mb-2 font-mono">
                {selectedClosure.sequenceNumber !== undefined ? `#${String(selectedClosure.sequenceNumber).padStart(6, '0')}` : `#${selectedClosure.id.substring(0,6).toUpperCase()}`}
              </div>
              <p className="text-xs text-[#878077] font-medium">
                {formatInTimeZone(new Date(selectedClosure.date), 'America/Guayaquil', "dd 'de' MMMM, yyyy - HH:mm:ss", { locale: es })}
              </p>
            </div>

            {/* Vendedor */}
            <div className="bg-[#fcfaf7] p-4 rounded-xl border border-[#e8dfd3] mb-6 flex items-center gap-3">
              <User className="w-4 h-4 text-[#878077]" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#878077] leading-none mb-0.5">Vendedor Responsable</span>
                <span className="font-bold text-sm text-[#1c1a17]">{selectedClosure.sellerName}</span>
              </div>
            </div>

            {/* Resultado del Cuadre */}
            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#878077] mb-3">Estado del Cuadre</h3>
              {(() => {
                let colorClass = '';
                let Icon = CheckCircle2;
                let title = 'Exacto';
                let desc = 'El dinero físico en caja y banco coincide exactamente con lo registrado por el sistema.';

                if (selectedClosure.status === 'warning') {
                  colorClass = 'border-yellow-200 bg-yellow-50 text-yellow-800';
                  Icon = AlertTriangle;
                  title = 'Tolerancia Aceptable';
                  desc = `Hay una diferencia menor de $${Math.abs(selectedClosure.difference).toFixed(2)} que se encuentra en el rango de tolerancia de $2.00.`;
                } else if (selectedClosure.status === 'mismatch') {
                  colorClass = 'border-red-200 bg-red-50 text-red-800';
                  Icon = XCircle;
                  title = 'Descuadre Alertado';
                  desc = `Se reportó una diferencia significativa de $${selectedClosure.difference.toFixed(2)} frente al balance teórico del sistema.`;
                } else {
                  colorClass = 'border-green-200 bg-green-50 text-green-800';
                }

                return (
                  <div className={`p-4 rounded-2xl border ${colorClass} flex gap-3`}>
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-sm block mb-1 uppercase tracking-wide">{title}</span>
                      <p className="text-xs font-medium opacity-90 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Comparativa Detallada */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#878077] border-b border-[#e8dfd3] pb-2">Tabla Comparativa</h3>
              
              {/* Efectivo */}
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="font-semibold text-gray-500">Efectivo Sistema:</span>
                <span className="font-bold font-mono text-[#1c1a17]">${selectedClosure.systemCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="font-semibold text-[#1c1a17]">Efectivo Real (Caja):</span>
                <span className="font-black font-mono text-[#1c1a17]">${selectedClosure.realCash.toFixed(2)}</span>
              </div>

              {/* Transferencia */}
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100 mt-2">
                <span className="font-semibold text-gray-500">Transf. Sistema:</span>
                <span className="font-bold font-mono text-[#1c1a17]">${selectedClosure.systemTransfer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100 font-bold">
                <span className="font-semibold text-[#1c1a17]">Transf. Real (Banco):</span>
                <span className="font-black font-mono text-[#1c1a17]">${selectedClosure.realTransfer.toFixed(2)}</span>
              </div>

              {/* Totales */}
              <div className="bg-[#fcfaf7] p-3 rounded-xl border border-[#e8dfd3] mt-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#878077]">
                  <span>Total Teórico (Sistema)</span>
                  <span className="font-mono">${selectedClosure.systemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#1c1a17]">
                  <span>Total Real (Físico)</span>
                  <span className="font-mono">${selectedClosure.realTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-dashed border-[#e8dfd3] pt-2">
                  <span className="text-[#878077]">Diferencia de Cuadre</span>
                  <span className={`font-mono font-black ${selectedClosure.difference > 0 ? 'text-green-600' : selectedClosure.difference < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {selectedClosure.difference >= 0 ? '+' : ''}{selectedClosure.difference.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
