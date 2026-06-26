import React, { useState } from 'react';
import { Beef, Lock, User, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface LoginProps {
  onLogin: (user: import('../types').Seller) => void;
  sellers: import('../types').Seller[];
}

export default function Login({ onLogin, sellers }: LoginProps) {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth request
    setTimeout(() => {
      const activeSeller = sellers.find(s => s.status === 'Activo' && s.cedula === cedula && s.password === password);
      
      if (cedula === '1234567890' && password === 'admin') {
        onLogin({
          id: '1',
          name: 'Administrador Principal',
          cedula: '1234567890',
          phone: '',
          role: 'Administrador',
          status: 'Activo'
        });
      } else if (activeSeller) {
        onLogin(activeSeller);
      } else {
        showToast('Credenciales incorrectas', 'error');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="bg-[#f0e8dd] text-[#1c1a17] font-sans h-screen w-full flex items-center justify-center p-6 select-none font-medium">
      <div className="bg-[#fcfaf7] w-full max-w-md rounded-[2.5rem] shadow-xl border border-[#e8dfd3] p-8 md:p-12">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-[#fcaecb] rounded-full flex items-center justify-center mb-4">
            <Beef className="w-8 h-8 text-[#be185d]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1c1a17]">Top Fresh</h1>
          <p className="text-[#878077] text-sm mt-2 text-center">Sistema de Control y Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Número de Cédula</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e8dfd3] rounded-2xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold transition-all shadow-sm"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#878077] uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e8dfd3] rounded-2xl focus:ring-2 focus:ring-[#cbaefc] focus:outline-none text-sm font-semibold transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1c1a17] hover:bg-black disabled:bg-[#1c1a17]/70 text-white font-bold py-4 rounded-2xl transition-all shadow-md active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#f0e8dd] text-center">
          <p className="text-[10px] text-[#878077] uppercase tracking-wider font-bold">
            v1.0.0 Professional Edition
          </p>
          <p className="text-[9px] text-[#878077] uppercase tracking-wider font-bold mt-2 opacity-70">
            Desarrollado por Palma Nexus Solutions 2026
          </p>
        </div>
      </div>
    </div>
  );
}
