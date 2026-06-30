import { TrendingUp, FileText, CalendarDays, Edit2, Plus, Phone, Mail, Link as LinkIcon, Calendar, Trash2, ExternalLink, User } from 'lucide-react';
import { Sale, Product, Goal } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

export default function Dashboard({ sales, products, goals, setGoals }: { sales: Sale[], products: Product[], goals: Goal[], setGoals: (g: Goal[]) => void }) {
  const ecuadorTimeZone = 'America/Guayaquil';
  const todayDate = new Date();
  const todayEcuador = formatInTimeZone(todayDate, ecuadorTimeZone, 'yyyy-MM-dd');
  const monthStart = startOfMonth(todayDate);
  const monthEnd = endOfMonth(todayDate);
  
  const activeSales = sales.filter(s => s.status !== 'voided' && !s.isCashRegisterClose);
  const voidedSales = sales.filter(s => s.status === 'voided');

  const salesToday = activeSales.filter(s => {
    try {
      return formatInTimeZone(new Date(s.date), ecuadorTimeZone, 'yyyy-MM-dd') === todayEcuador;
    } catch (e) {
      // Fallback if s.date is malformed
      return s.date.startsWith(todayEcuador);
    }
  });
  const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);
  
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);

  const voidedTotal = voidedSales.reduce((sum, s) => sum + s.total, 0);

  const salesThisMonth = activeSales.filter(s => {
    try {
      return isWithinInterval(new Date(s.date), { start: monthStart, end: monthEnd });
    } catch (e) {
      return false;
    }
  });
  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);

  const currentMonthStr = format(todayDate, 'yyyy-MM');
  const currentGoal = goals.find(g => g.month === currentMonthStr)?.amount || 10000;
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoalAmount, setEditingGoalAmount] = useState(currentGoal.toString());

  const handleSaveGoal = () => {
    const val = parseFloat(editingGoalAmount);
    if (isNaN(val) || val <= 0) return;
    
    const existing = goals.findIndex(g => g.month === currentMonthStr);
    const newGoals = [...goals];
    if (existing >= 0) {
      newGoals[existing].amount = val;
    } else {
      newGoals.push({
        id: Date.now().toString(),
        month: currentMonthStr,
        amount: val
      });
    }
    setGoals(newGoals);
    setIsEditingGoal(false);
  };

  const criticalStockCount = products ? products.filter(p => p.stock <= 10).length : 0;

  // Sort recent sales
  const recentSales = [...activeSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  // Calculate last 7 days data
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(todayDate, 6 - i);
    const dateStr = formatInTimeZone(d, ecuadorTimeZone, 'yyyy-MM-dd');
    const dayName = formatInTimeZone(d, ecuadorTimeZone, 'EEE', { locale: es });
    
    const daySales = activeSales.filter(s => {
      try {
        return formatInTimeZone(new Date(s.date), ecuadorTimeZone, 'yyyy-MM-dd') === dateStr;
      } catch (e) {
        return s.date.startsWith(dateStr);
      }
    });

    return {
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      fullDate: dateStr,
      total: daySales.reduce((sum, s) => sum + s.total, 0)
    };
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent rounded-3xl h-full pb-4">
      <div className="flex items-center gap-4 mb-6">
         <h1 className="text-2xl font-semibold text-[#1c1a17]">Resumen del Negocio</h1>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left main area */}
        <div className="flex-[7] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Metric Cards Grid */}
            <div className="bg-[#fcfaf7] p-6 rounded-3xl border border-[#e8dfd3]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg">Resumen Comercial</h3>
                    </div>
                    <div className="flex gap-2">
                       <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Edit2 className="w-3 h-3" /></button>
                       <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Card 1 */}
                    <div className="bg-[#fcdcae] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium text-sm">Ventas Totales</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">${totalRevenue.toFixed(2)}</h4>
                        <p className="text-xs text-black/60">Histórico general</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#aecbfc] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium text-sm">Facturación del Mes</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">${revenueThisMonth.toFixed(2)}</h4>
                        <p className="text-xs text-black/60">En el mes actual</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#cbaefc] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <CalendarDays className="w-4 h-4" />
                            <span className="font-medium text-sm">Ventas Hoy</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">${revenueToday.toFixed(2)}</h4>
                        <p className="text-xs text-black/60">En el día de hoy</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-[#fcbcae] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium text-sm">Mermas y Devoluciones</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">${voidedTotal.toFixed(2)}</h4>
                        <p className="text-xs text-black/60">Ventas anuladas</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>

                    {/* Card 5 */}
                    <div className="bg-[#fcaee8] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium text-sm">Pedidos Pendientes</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">$0.00</h4>
                        <p className="text-xs text-black/60">Sin pedidos pendientes</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>

                    {/* Card 6 */}
                    <div className="bg-[#fcaecb] rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-8 text-black/70">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium text-sm">Stock Crítico</span>
                        </div>
                        <h4 className="text-3xl font-bold mb-1">{criticalStockCount} Productos</h4>
                        <p className="text-xs text-black/60">Stock menor a 10 unidades</p>
                        <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 pb-6">
                
                {/* Sales Bar Chart */}
                <div className="bg-[#fcfaf7] p-6 rounded-3xl border border-[#e8dfd3] flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                         <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                             <TrendingUp className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="font-semibold text-sm">Análisis de Ventas (Últimos 7 días)</h3>
                    </div>

                    <div className="flex-1 w-full h-[300px] min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8dfd3" />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#878077', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#878077', fontSize: 12 }} 
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                                    labelStyle={{ color: '#878077', fontWeight: 'bold', marginBottom: '4px' }}
                                />
                                <Bar dataKey="total" fill="#cbaefc" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Milestones / Tasks */}
                <div className="bg-[#fcfaf7] p-6 rounded-3xl border border-[#e8dfd3]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                 <FileText className="w-4 h-4 text-white" />
                             </div>
                             <h3 className="font-semibold text-sm">Meta Mensual</h3>
                        </div>
                        <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Edit2 className="w-3 h-3" /></button>
                    </div>

                    {isEditingGoal ? (
                      <div className="mb-4 flex gap-2">
                        <input 
                          type="number" 
                          value={editingGoalAmount} 
                          onChange={e => setEditingGoalAmount(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#e8dfd3] rounded-lg focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-bold"
                        />
                        <button onClick={handleSaveGoal} className="px-4 py-1.5 bg-[#1c1a17] text-white rounded-lg text-sm font-bold">Guardar</button>
                      </div>
                    ) : (
                      <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                              <span>$0</span>
                              <span className="font-bold text-[#1c1a17]">${revenueThisMonth.toFixed(2)} actual</span>
                              <span>${currentGoal.toLocaleString('en-US')}</span>
                          </div>
                          <div className="h-2 shadow-inner w-full bg-[#f0e8dd] rounded-full overflow-hidden">
                             <div className="h-full bg-[#cbaefc] rounded-full transition-all duration-1000" style={{ width: `${Math.min((revenueThisMonth / currentGoal) * 100, 100)}%` }}></div>
                          </div>
                          {revenueThisMonth >= currentGoal && (
                            <p className="text-xs text-green-600 font-bold mt-2 text-center">¡Felicidades! Meta alcanzada 🎉</p>
                          )}
                      </div>
                    )}

                    <div className="space-y-4 mt-6">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <FileText className="w-8 h-8 text-gray-300 mb-3" />
                            <h4 className="text-[13px] font-semibold text-gray-600 mb-1 leading-tight">Sin tareas pendientes</h4>
                            <p className="text-xs text-gray-400">Las tareas y pedidos aparecerán aquí</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
