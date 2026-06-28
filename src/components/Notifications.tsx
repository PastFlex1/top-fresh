import React, { useState, useRef, useEffect } from 'react';
import { Bell, PackageOpen, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { Product, Purchase } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationsProps {
  products: Product[];
  purchases: Purchase[];
}

export default function Notifications({ products, purchases }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  // Generar notificaciones
  const lowStockNotifications = products
    .filter(p => p.stock <= 10)
    .map(p => ({
      id: `low-stock-${p.id}`,
      type: 'warning' as const,
      title: 'Stock bajo',
      message: `${p.name} tiene un stock crítico de ${Number(p.stock.toFixed(2))} ${p.unit}.`,
      date: new Date(), // Siempre actual para stock bajo
      isRead: false
    }));

  const arrivalNotifications = purchases
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5) // Últimas 5 llegadas
    .map(p => ({
      id: `arrival-${p.id}`,
      type: 'success' as const,
      title: 'Llegada de productos',
      message: `Recibiste ${p.items.length} productos de ${p.supplierName}.`,
      date: new Date(p.date),
      isRead: false
    }));

  const notifications = [...lowStockNotifications, ...arrivalNotifications]
    .filter(n => !dismissedNotifs.includes(n.id))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 relative rounded-full border border-[#e8dfd3] flex items-center justify-center text-[#878077] bg-white hover:bg-[#fcfaf7]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#e8dfd3] z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#e8dfd3] flex items-center justify-between bg-[#fcfaf7]">
            <h3 className="font-bold text-[#1c1a17]">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#1c1a17] text-white text-[10px] font-bold rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No tienes notificaciones
              </div>
            ) : (
              <div className="divide-y divide-[#e8dfd3]">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3 group relative">
                    <div className="mt-0.5">
                      {notif.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <PackageOpen className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm font-bold text-[#1c1a17] mb-0.5">{notif.title}</h4>
                      <p className="text-xs text-gray-600 leading-tight mb-1.5">{notif.message}</p>
                      <div className="flex items-center text-[10px] text-gray-400 font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(notif.date, { addSuffix: true, locale: es })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedNotifs([...dismissedNotifs, notif.id]);
                      }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      title="Ocultar notificación"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
