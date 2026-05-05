import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(form.email, form.password);
      navigate('/maestros');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#248842]">
      <div className="w-full max-w-md px-4">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.webp" 
            alt="Logo institución"
            className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white">Control de Permisos</h1>
          <p className="text-white/80 text-sm mt-1">
            Complejo Educativo República de Brasil
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-[#000000] mb-6">
            Iniciar sesión
          </h2>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#248842] focus:ring-2 focus:ring-[#248842]/30 transition"
                placeholder="secretaria@brasil.edu.sv"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#248842] focus:ring-2 focus:ring-[#248842]/30 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#248842] hover:bg-[#1f6f36] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md mt-2 flex items-center justify-center gap-2"
            >
              {cargando && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/70 mt-6">
          Sistema administrativo — Ciclo escolar 2026
        </p>
      </div>
    </div>
  );
}