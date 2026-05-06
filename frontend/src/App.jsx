import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from '../pages/Auth/Login';
import ListaMaestros from '../pages/Maestros/ListaMaestros';
import DetalleMaestro from '../pages/Maestros/DetalleMaestro';
import RegistroPermiso from '../pages/Permisos/RegistroPermiso';
import Reportes from '../pages/Reportes/Reportes';
import ListaPermisos from '../pages/Permisos/ListaPermisos';

const C = {
  verde: '#248842',
  verdeOscuro: '#1a6b32',
  verdeHover: '#1f6f36',
  amarillo: '#FAD327',
  amarilloHover: '#e5c020',
  marron: '#7A3F25',
  blanco: '#FFFFFF',
  negro: '#000000',
  grisFondo: '#f5f5f5',
  grisClaro: '#e5e5e5',
};

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      to: '/maestros',
      label: 'Maestros',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      to: '/permisos',
      label: 'Permisos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      to: '/permisos/nuevo',
      label: 'Registrar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: '/reportes',
      label: 'Reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.grisFondo }}>
      {/* Sidebar Desktop */}
      <aside
        className="w-64 flex-col hidden md:flex shrink-0"
        style={{ backgroundColor: C.verde, borderRight: `2px solid ${C.verdeOscuro}` }}
      >
        {/* Logo / Header */}
        <div className="p-5" style={{ borderBottom: `2px solid ${C.verdeOscuro}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md"
              style={{ backgroundColor: C.amarillo, border: `2px solid ${C.amarilloHover}` }}
            >
              <img
                src="/logo.webp"
                alt="Logo institución"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black leading-tight truncate" style={{ color: C.blanco }}>
                C. E. República
              </p>
              <p className="text-xs font-bold opacity-90" style={{ color: C.amarillo }}>
                de Brasil
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-3 flex-1 space-y-1.5">
          {navItems.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden"
                style={{
                  backgroundColor: active ? C.amarillo : 'transparent',
                  color: active ? C.negro : 'rgba(255,255,255,0.85)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = C.verdeHover;
                    e.currentTarget.style.color = C.blanco;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }
                }}
              >
                {/* Indicador activo */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ backgroundColor: C.negro }}
                  />
                )}
                <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer usuario */}
        <div className="p-3" style={{ borderTop: `2px solid ${C.verdeOscuro}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.verdeOscuro }}>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm shadow-sm"
              style={{ backgroundColor: C.amarillo, color: C.negro }}
            >
              {usuario?.nombre?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: C.blanco }}>
                {usuario?.nombre || 'Usuario'}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-80" style={{ color: C.amarillo }}>
                {usuario?.rol?.toLowerCase() || 'invitado'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ color: C.blanco }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.amarillo; e.currentTarget.style.backgroundColor = C.verde; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.blanco; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar Mobile */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: C.verde, borderBottom: `2px solid ${C.verdeOscuro}` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: C.amarillo }}>
            <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <p className="font-bold text-sm truncate" style={{ color: C.blanco }}>
            C. E. República de Brasil
          </p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg transition-all active:scale-90"
          style={{ color: C.blanco }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Bottom nav Mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        style={{ backgroundColor: C.verde, borderTop: `2px solid ${C.verdeOscuro}` }}
      >
        {navItems.map(item => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-all duration-200 relative"
              style={{
                color: active ? C.amarillo : 'rgba(255,255,255,0.6)',
              }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  style={{ backgroundColor: C.amarillo }}
                />
              )}
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 mt-14 md:mt-0 mb-20 md:mb-0">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/maestros" element={<ListaMaestros />} />
                  <Route path="/maestros/:id" element={<DetalleMaestro />} />
                  <Route path="/permisos" element={<ListaPermisos />} />
                  <Route path="/permisos/nuevo" element={<RegistroPermiso />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="*" element={<Navigate to="/maestros" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}