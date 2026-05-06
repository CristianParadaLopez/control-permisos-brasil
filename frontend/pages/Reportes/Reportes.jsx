import { useState, useEffect } from 'react';
import api from '../../services/api';

const C = {
  verde: '#248842',
  verdeOscuro: '#1a6b32',
  verdeClaro: '#e8f5ec',
  amarillo: '#FAD327',
  amarilloClaro: '#fef9e0',
  marron: '#7A3F25',
  marronClaro: '#f5ebe6',
  blanco: '#FFFFFF',
  negro: '#000000',
  gris: '#f5f5f5',
  grisMedio: '#e5e5e5',
  grisTexto: '#666666',
};

function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const p = [];
  if (dias) p.push(`${dias}d`);
  if (horas) p.push(`${horas}h`);
  if (minutos) p.push(`${minutos}m`);
  return p.join(' ') || '0m';
}

function BarraProgreso({ porcentaje, tipo }) {
  const ancho = Math.min(porcentaje, 100);
  const esCritico = porcentaje > 80;
  return (
    <div className="w-full mt-1.5">
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span style={{ color: esCritico ? C.marron : C.grisTexto }}>{porcentaje}% usado</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.gris }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${ancho}%`,
            backgroundColor: esCritico ? C.amarillo : tipo === 'ENFERMEDAD' ? C.verde : C.marron,
          }}
        />
      </div>
    </div>
  );
}

export default function Reportes() {
  const [resumen, setResumen] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [anoId, setAnoId] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: ano } = await api.get('/reportes/ano-activo');
        setAnoId(ano.id);
        const { data } = await api.get('/reportes/resumen', { params: { anoEscolarId: ano.id } });
        setResumen(data);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res = await api.get('/reportes/excel', {
        params: { anoEscolarId: anoId },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `permisos_brasil_${new Date().getFullYear()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const filtrados = resumen.filter(r =>
    r.maestro?.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.maestro?.nipEscalafon?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalEnfermedad = filtrados.reduce((acc, r) => acc + (r.enfermedad?.usado?.dias || 0), 0);
  const totalPersonal = filtrados.reduce((acc, r) => acc + (r.personal?.usado?.dias || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2" style={{ borderColor: `${C.verde}20` }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: C.verde }}>
            Reportes
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: C.marron }}>
            Resumen de permisos — Ciclo 2026
          </p>
        </div>
        <button
          onClick={handleExportar}
          disabled={exportando || !anoId}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          style={{
            backgroundColor: C.verde,
            color: C.blanco,
            boxShadow: '0 4px 14px rgba(36,136,66,0.35)'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exportando ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando...
            </span>
          ) : (
            'Exportar Excel'
          )}
        </button>
      </div>

      {/* Stats cards */}
      {!cargando && filtrados.length > 0 && (
        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
          <div className="rounded-xl p-4 border-2" style={{ backgroundColor: C.verdeClaro, borderColor: `${C.verde}25` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.verdeOscuro }}>Total Enfermedad</p>
            <p className="text-2xl font-black mt-1" style={{ color: C.verde }}>{totalEnfermedad}d</p>
          </div>
          <div className="rounded-xl p-4 border-2" style={{ backgroundColor: C.amarilloClaro, borderColor: `${C.amarillo}40` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.marron }}>Total Personal</p>
            <p className="text-2xl font-black mt-1" style={{ color: C.marron }}>{totalPersonal}d</p>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 transition-colors" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full rounded-xl pl-12 pr-4 py-3 text-sm border-2 bg-white text-black placeholder-gray-400 outline-none transition-all duration-200 hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_4px_rgba(36,136,66,0.12)]"
          style={{ borderColor: `${C.verde}30` }}
          placeholder="Buscar maestro por nombre o NIP..."
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center transition hover:scale-110"
            style={{ color: C.marron }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${C.verde}30`, borderTopColor: C.verde }} />
          <p className="text-sm font-medium animate-pulse" style={{ color: C.marron }}>Cargando reporte...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed" style={{ borderColor: `${C.verde}25`, backgroundColor: C.verdeClaro }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.verde}15` }}>
            <svg className="w-8 h-8" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-bold text-lg" style={{ color: C.marron }}>
            {busqueda ? 'No se encontraron coincidencias' : 'No hay permisos registrados aún'}
          </p>
          <p className="text-sm mt-1" style={{ color: C.marron, opacity: 0.7 }}>
            {busqueda ? 'Intenta con otro término de búsqueda' : 'Los permisos aparecerán aquí una vez registrados'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 overflow-hidden shadow-sm" style={{ backgroundColor: C.blanco, borderColor: `${C.verde}20` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.verdeClaro, borderBottom: `2px solid ${C.verde}30` }}>
                  <th className="text-left text-[11px] font-black uppercase tracking-wider px-5 py-4" style={{ color: C.verdeOscuro }}>Maestro</th>
                  <th className="text-left text-[11px] font-black uppercase tracking-wider px-5 py-3 hidden sm:table-cell" style={{ color: C.verdeOscuro }}>NIP</th>
                  <th className="text-center text-[11px] font-black uppercase tracking-wider px-5 py-3 w-48" style={{ color: C.verdeOscuro }}>Enfermedad</th>
                  <th className="text-center text-[11px] font-black uppercase tracking-wider px-5 py-3 w-48" style={{ color: C.verdeOscuro }}>Personal</th>
                  <th className="text-center text-[11px] font-black uppercase tracking-wider px-5 py-3 hidden md:table-cell" style={{ color: C.verdeOscuro }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r, i) => {
                  const enf = r.enfermedad;
                  const pers = r.personal;
                  const critico = (enf?.porcentajeUsado || 0) > 80 || (pers?.porcentajeUsado || 0) > 80;
                  return (
                    <tr
                      key={i}
                      className="transition-all duration-200 group"
                      style={{
                        borderBottom: i < filtrados.length - 1 ? `1px solid ${C.grisMedio}` : 'none',
                        backgroundColor: C.blanco
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.verdeClaro; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.blanco; }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${C.verde}15`, color: C.verde }}>
                            {r.maestro?.nombreCompleto?.charAt(0) || '?'}
                          </div>
                          <span className="font-bold text-sm truncate" style={{ color: C.negro }}>{r.maestro?.nombreCompleto || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: C.gris, color: C.marron }}>
                          {r.maestro?.nipEscalafon}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {enf ? (
                          <div className="text-center">
                            <p className="font-mono text-sm font-bold" style={{ color: C.verde }}>{fmtTiempo(enf.usado)}</p>
                            <BarraProgreso porcentaje={enf.porcentajeUsado || 0} tipo="ENFERMEDAD" />
                          </div>
                        ) : (
                          <span className="block text-center text-xs font-medium" style={{ color: C.grisTexto }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {pers ? (
                          <div className="text-center">
                            <p className="font-mono text-sm font-bold" style={{ color: C.marron }}>{fmtTiempo(pers.usado)}</p>
                            <BarraProgreso porcentaje={pers.porcentajeUsado || 0} tipo="PERSONAL" />
                          </div>
                        ) : (
                          <span className="block text-center text-xs font-medium" style={{ color: C.grisTexto }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all"
                          style={{
                            backgroundColor: critico ? C.amarilloClaro : C.verdeClaro,
                            color: critico ? C.marron : C.verdeOscuro,
                            borderColor: critico ? `${C.amarillo}50` : `${C.verde}30`
                          }}
                        >
                          {critico && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {critico ? 'Crítico' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}