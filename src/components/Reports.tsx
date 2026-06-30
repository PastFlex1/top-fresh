import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, DollarSign, Package, Calendar, Award, ChevronRight, Download, Receipt } from 'lucide-react';
import { Sale, Product, Expense } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { useToast } from '../contexts/ToastContext';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
}

export default function Reports({ sales, products, expenses }: ReportsProps) {
  const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { showToast } = useToast();

  const activeSales = useMemo(() => sales.filter(s => s.status !== 'voided' && !s.isCashRegisterClose), [sales]);

  const filteredSales = useMemo(() => {
    let start = new Date(0);
    let end = new Date();

    if (startDate) {
      start = startOfDay(parseISO(startDate));
    }
    if (endDate) {
      end = endOfDay(parseISO(endDate));
    }

    return activeSales.filter(sale => {
      try {
        const date = new Date(sale.date);
        return isWithinInterval(date, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [activeSales, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    let start = new Date(0);
    let end = new Date();
    if (startDate) start = startOfDay(parseISO(startDate));
    if (endDate) end = endOfDay(parseISO(endDate));
    
    return expenses.filter(expense => {
      try {
        const date = new Date(expense.date);
        return isWithinInterval(date, { start, end });
      } catch (e) {
        return false;
      }
    });
  }, [expenses, startDate, endDate]);

  // Reporte de ventas totales
  const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  // Total gastos operativos
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Reporte de ganancias (Ingresos - Costo de productos - Gastos operativos)
  const totalProfit = filteredSales.reduce((sum, sale) => {
    const saleProfit = sale.items.reduce((itemSum, item) => {
      const itemCost = item.cost || 0;
      return itemSum + ((item.price - itemCost) * item.quantity);
    }, 0);
    return sum + saleProfit;
  }, 0) - totalExpensesAmount;

  // Reporte costo total de inventario
  const totalInventoryCost = products.reduce((sum, product) => {
    return sum + ((product.cost || 0) * product.stock);
  }, 0);

  // Gráfico de ganancias por mes (últimos 6 meses)
  const monthlyProfitData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthSales = activeSales.filter(sale => {
        try {
          const date = new Date(sale.date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        } catch (e) {
          return false;
        }
      });

      const profit = monthSales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
          return itemSum + ((item.price - (item.cost || 0)) * item.quantity);
        }, 0);
      }, 0);

      const monthExpenses = expenses.filter(e => {
        try {
          const date = new Date(e.date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      });
      const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const revenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);

      return {
        name: format(month, 'MMM', { locale: es }).toUpperCase(),
        profit: profit - monthExpensesTotal,
        revenue,
        expenses: monthExpensesTotal
      };
    });
  }, [activeSales]);

  // Ranking de productos vendidos
  const productRanking = useMemo(() => {
    const productStats: Record<string, { quantity: number; revenue: number; name: string; unit: string }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            quantity: 0,
            revenue: 0,
            name: item.productName,
            unit: item.unit
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10
  }, [filteredSales]);

  const handleExportExcel = async () => {
    let chartImageId: number | null = null;
    const chartElement = document.getElementById('monthly-profit-chart');
    
    const workbook = new ExcelJS.Workbook();
    
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2 // High resolution
        });
        const base64Image = canvas.toDataURL('image/png');
        chartImageId = workbook.addImage({
          base64: base64Image,
          extension: 'png',
        });
      } catch (e) {
        console.error('Error capturando la gráfica', e);
      }
    }

    const worksheet = workbook.addWorksheet('Dashboard Financiero', {
      views: [{ showGridLines: false }]
    });

    worksheet.columns = [
      { width: 4 },  // A: Spacer
      { width: 40 }, // B: Principal
      { width: 25 }, // C: Numérico
      { width: 25 }, // D: Numérico
      { width: 4 },  // E: Spacer
    ];

    // --- Header ---
    worksheet.mergeCells('B2:D3');
    const titleCell = worksheet.getCell('B2');
    titleCell.value = 'REPORTE FINANCIERO TOP FRESH';
    titleCell.font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1A17' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Narrative ---
    worksheet.mergeCells('B5:D6');
    const narrativeCell = worksheet.getCell('B5');
    narrativeCell.value = `Resumen ejecutivo desde el ${startDate} al ${endDate}. Detalle de ventas, gastos y estado de inventario.`;
    narrativeCell.font = { name: 'Segoe UI', size: 11, italic: true, color: { argb: 'FF878077' } };
    narrativeCell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };

    // --- KPIs ---
    ['B8', 'C8', 'D8'].forEach(cell => {
      const c = worksheet.getCell(cell);
      c.font = { name: 'Segoe UI', bold: true, size: 10, color: { argb: 'FF878077' } };
      c.alignment = { horizontal: 'center' };
    });
    worksheet.getCell('B8').value = 'VENTAS TOTALES';
    worksheet.getCell('C8').value = 'GASTOS OPERATIVOS';
    worksheet.getCell('D8').value = 'GANANCIA NETA';

    ['B9', 'C9', 'D9'].forEach(cell => {
      const c = worksheet.getCell(cell);
      c.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FF1C1A17' } };
      c.alignment = { horizontal: 'center' };
      c.numFmt = '"$"#,##0.00';
    });
    worksheet.getCell('B9').value = totalSalesRevenue;
    worksheet.getCell('C9').value = totalExpensesAmount;
    
    const profitCell = worksheet.getCell('D9');
    profitCell.value = totalProfit;
    profitCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: totalProfit >= 0 ? 'FF047857' : 'FFE11D48' } };

    // --- Top Products Title ---
    let startRow = 12;
    worksheet.mergeCells(`B${startRow}:D${startRow}`);
    const topProdTitle = worksheet.getCell(`B${startRow}`);
    topProdTitle.value = 'TOP PRODUCTOS MÁS VENDIDOS';
    topProdTitle.font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FF1C1A17' } };
    topProdTitle.border = { bottom: { style: 'thick', color: { argb: 'FF1C1A17' } } };
    
    startRow++;
    worksheet.getCell(`B${startRow}`).value = 'Producto';
    worksheet.getCell(`C${startRow}`).value = 'Cantidad Vendida';
    worksheet.getCell(`D${startRow}`).value = 'Ingresos ($)';
    ['B', 'C', 'D'].forEach(col => {
      const c = worksheet.getCell(`${col}${startRow}`);
      c.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF878077' } };
      c.alignment = { horizontal: col === 'B' ? 'left' : 'center' };
    });

    startRow++;
    productRanking.forEach((prod, idx) => {
      const bg = idx % 2 === 0 ? 'FFFCFAF7' : 'FFFFFFFF';
      ['B', 'C', 'D'].forEach(col => {
        const c = worksheet.getCell(`${col}${startRow}`);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.font = { name: 'Segoe UI', color: { argb: 'FF1C1A17' } };
        c.border = { bottom: { style: 'thin', color: { argb: 'FFE8DFD3' } } };
      });

      worksheet.getCell(`B${startRow}`).value = prod.name;
      
      const qtyCell = worksheet.getCell(`C${startRow}`);
      qtyCell.value = `${prod.quantity.toFixed(2)} ${prod.unit}`;
      qtyCell.alignment = { horizontal: 'center' };

      const revCell = worksheet.getCell(`D${startRow}`);
      revCell.value = prod.revenue;
      revCell.numFmt = '"$"#,##0.00';
      revCell.alignment = { horizontal: 'center' };
      startRow++;
    });

    // --- Monthly Evolution Title ---
    startRow += 3;
    worksheet.mergeCells(`B${startRow}:D${startRow}`);
    const evoTitle = worksheet.getCell(`B${startRow}`);
    evoTitle.value = 'EVOLUCIÓN DE GANANCIAS (ÚLTIMOS 6 MESES)';
    evoTitle.font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FF1C1A17' } };
    evoTitle.border = { bottom: { style: 'thick', color: { argb: 'FF1C1A17' } } };

    if (chartImageId !== null) {
      worksheet.addImage(chartImageId, {
        tl: { col: 1, row: startRow }, // Col B, Row startRow + 1
        ext: { width: 500, height: 250 }
      });
      startRow += 14; // Dejar espacio para la imagen (aprox 14 filas)
    }
    
    startRow++;
    worksheet.getCell(`B${startRow}`).value = 'Mes';
    worksheet.getCell(`C${startRow}`).value = 'Ventas ($)';
    worksheet.getCell(`D${startRow}`).value = 'Ganancia Neta ($)';
    ['B', 'C', 'D'].forEach(col => {
      const c = worksheet.getCell(`${col}${startRow}`);
      c.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBAEFC' } };
      c.alignment = { horizontal: col === 'B' ? 'left' : 'center' };
    });

    startRow++;
    monthlyProfitData.forEach((data, idx) => {
      const bg = idx % 2 === 0 ? 'FFFCFAF7' : 'FFFFFFFF';
      ['B', 'C', 'D'].forEach(col => {
        const c = worksheet.getCell(`${col}${startRow}`);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        c.font = { name: 'Segoe UI', color: { argb: 'FF1C1A17' } };
        c.border = { bottom: { style: 'thin', color: { argb: 'FFE8DFD3' } } };
      });

      worksheet.getCell(`B${startRow}`).value = data.name;
      
      const salesCell = worksheet.getCell(`C${startRow}`);
      salesCell.value = data.revenue;
      salesCell.numFmt = '"$"#,##0.00';
      salesCell.alignment = { horizontal: 'center' };
      
      const profitCell = worksheet.getCell(`D${startRow}`);
      profitCell.value = data.profit;
      profitCell.numFmt = '"$"#,##0.00';
      profitCell.alignment = { horizontal: 'center' };
      profitCell.font = { name: 'Segoe UI', bold: true, color: { argb: data.profit >= 0 ? 'FF047857' : 'FFE11D48' } };
      
      startRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Financiero_${startDate}_${endDate}.xlsx`);
    showToast('Reporte exportado correctamente', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-[#1c1a17]">Reportes y Analíticas</h1>
          <p className="text-[#878077] text-sm">Rendimiento financiero y estadísticas del negocio</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-[#e8dfd3] p-1.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-[#878077]" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-[#1c1a17] focus:ring-0 p-0 cursor-pointer w-[120px]"
              />
            </div>
            <div className="w-px h-4 bg-[#e8dfd3]"></div>
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-bold text-[#878077] uppercase tracking-wider">al</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-[#1c1a17] focus:ring-0 p-0 cursor-pointer w-[120px]"
              />
            </div>
          </div>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#1c1a17] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e8dfd3] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-[#1c1a17]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#878077] uppercase tracking-wider mb-1">Ventas Totales</p>
            <h3 className="text-2xl font-black text-[#1c1a17]">${totalSalesRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#878077] uppercase tracking-wider mb-1">Gastos</p>
            <h3 className="text-2xl font-black text-[#1c1a17]">${totalExpensesAmount.toFixed(2)}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-[#047857]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#878077] uppercase tracking-wider mb-1">Ganancia Neta</p>
            <h3 className="text-2xl font-black text-[#1c1a17]">${totalProfit.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#fef08a] flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-[#a16207]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#878077] uppercase tracking-wider mb-1">Valor de Inventario</p>
            <h3 className="text-2xl font-black text-[#1c1a17]">${totalInventoryCost.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm" id="monthly-profit-chart">
          <h3 className="font-bold text-[#1c1a17] mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#878077]" />
            Evolución de Ganancias (6 Meses)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProfitData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8dfd3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#878077', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#878077' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#fcfaf7' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e8dfd3', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Ventas'];
                    if (name === 'expenses') return [`$${value.toFixed(2)}`, 'Gastos'];
                    return [`$${value.toFixed(2)}`, name];
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#1c1a17', marginBottom: '4px' }}
                />
                <Legend 
                  formatter={(value) => {
                    if (value === 'revenue') return 'Ventas';
                    if (value === 'expenses') return 'Gastos';
                    return value;
                  }}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }}
                />
                <Bar dataKey="revenue" name="revenue" fill="#1c1a17" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="expenses" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8dfd3] shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-[#1c1a17] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#878077]" />
            Ranking de Productos Más Vendidos
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {productRanking.length > 0 ? (
              <div className="space-y-3">
                {productRanking.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#fcfaf7] border border-transparent hover:border-[#e8dfd3] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${index < 3 ? 'bg-[#cbaefc] text-[#1c1a17]' : 'bg-[#e8dfd3] text-[#878077]'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-[#1c1a17] text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs font-medium text-[#878077]">
                          {product.quantity.toFixed(2)} {product.unit} vendidos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#1c1a17] text-sm">${product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#878077]">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No hay datos suficientes</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
