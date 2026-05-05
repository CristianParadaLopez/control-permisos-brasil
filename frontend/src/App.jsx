import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from '../pages/Auth/Login';
import ListaMaestros from '../pages/Maestros/ListaMaestros';
import DetalleMaestro from '../pages/Maestros/DetalleMaestro';
import RegistroPermiso from '../pages/Permisos/RegistroPermiso';
import Reportes from '../pages/Reportes/Reportes';
import ListaPermisos from '../pages/Permisos/ListaPermisos';

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { to: '/maestros', label: 'Maestros', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { 
      to: '/permisos', 
      label: 'Permisos', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { to: '/permisos/nuevo', label: 'Registrar', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
    { to: '/reportes', label: 'Reportes', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#248842] border-r border-[#1f6f36] flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-5 border-b border-[#1f6f36]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FAD327] rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-[#000000] text-sm font-bold leading-tight">C. E. República</p>
              <p className="text-[#000000] text-xs">de Brasil</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 space-y-1">
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? 'bg-[#FAD327] text-[#000000]' : 'text-white/80 hover:text-white hover:bg-[#1f6f36]'}`}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-[#1f6f36]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-7 h-7 bg-[#1f6f36] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-300">{usuario?.nombre?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#000000] text-xs font-medium truncate">{usuario?.nombre}</p>
              <p className="text-slate-500 text-xs capitalize">{usuario?.rol?.toLowerCase()}</p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="text-slate-500 hover:text-[#FAD327] transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#248842] border-b border-[#1f6f36] z-40 px-4 py-3 flex items-center justify-between">
        <p className="text-[#000000] font-bold text-sm">C. E. República de Brasil</p>
        <button onClick={logout} className="text-slate-400 hover:text-[#FAD327]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#248842] border-t border-[#1f6f36] z-40 flex">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${active ? 'text-[#FAD327]' : 'text-slate-500'}`}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 mt-14 md:mt-0 mb-20 md:mb-0">
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
