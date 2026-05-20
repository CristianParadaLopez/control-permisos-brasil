import { useState, useEffect } from 'react';
import api from '../../services/api';
import { getMaestros } from '../../services/maestrosService';

const C = { verde:'#248842', verdeOscuro:'#1a6b32', verdeClaro:'#e8f5ec', amarillo:'#FAD327', amarilloClaro:'#fef9e0', marron:'#7A3F25', blanco:'#FFFFFF', negro:'#000000', gris:'#f5f5f5', grisMedio:'#e5e5e5', grisTexto:'#666666' };
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtT({ dias=0,horas=0,minutos=0 }={}) {
  return [dias&&`${dias}d`,horas&&`${horas}h`,minutos&&`${minutos}m`].filter(Boolean).join(' ')||'0m';
}
function Barra({ pct, color }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: C.gris }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width:`${Math.min(pct,100)}%`, backgroundColor: pct>80?C.marron:color }}/>
    </div>
  );
}

export default function Reportes() {
  const [anoId, setAnoId]         = useState('');
  const [modo, setModo]           = useState('mes'); // 'mes' | 'maestro'
  const [maestros, setMaestros]   = useState([]);
  const [maestroId, setMaestroId] = useState('');
  const [mes, setMes]             = useState(() => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}`;
  });
  const [datos, setDatos]         = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [exportando, setExp]      = useState(false);
  const [busqueda, setBusqueda]   = useState('');

  // Cargar año activo y maestros al montar
  useEffect(() => {
    api.get('/reportes/ano-activo').then(r => setAnoId(r.data.id)).catch(()=>{});
    getMaestros({ limite: 200 }).then(r => setMaestros(r.data || []));
  }, []);

  // Cargar datos al cambiar filtros
  useEffect(() => {
    if (!anoId) return;
    const cargar = async () => {
      setCargando(true); setDatos([]);
      try {
        if (modo === 'mes' && mes) {
          const r = await api.get('/reportes/por-mes', { params: { anoEscolarId: anoId, mes } });
          setDatos(r.data);
        } else if (modo === 'maestro' && maestroId) {
          const r = await api.get('/reportes/por-maestro', { params: { anoEscolarId: anoId, maestroId } });
          setDatos([r.data]); // envolver en array para render uniforme
        }
      } catch { setDatos([]); }
      finally { setCargando(false); }
    };
    cargar();
  }, [anoId, modo, mes, maestroId]);

  const handleExportar = async () => {
    setExp(true);
    try {
      const params = { anoEscolarId: anoId };
      if (modo === 'mes')     params.mes      = mes;
      if (modo === 'maestro') params.maestroId = maestroId;
      const res = await api.get('/reportes/excel', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = modo === 'mes' ? `permisos_${mes}.xlsx` : `permisos_maestro.xlsx`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch { alert('Error al exportar'); }
    finally { setExp(false); }
  };

  const inputCls = 'border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#248842] focus:ring-2 focus:ring-[#248842]/30 transition bg-white text-black';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2" style={{ borderColor:`${C.verde}20` }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: C.verde }}>Reportes</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: C.marron }}>Consulta y exporta al formato del MINED</p>
        </div>
        <button onClick={handleExportar} disabled={exportando || !anoId}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
          style={{ backgroundColor: C.verde }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {exportando ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Tabs modo */}
      <div className="flex gap-2 p-1 rounded-2xl w-fit" style={{ backgroundColor: C.gris }}>
        {[['mes','Por Mes'],['maestro','Por Maestro']].map(([val,label]) => (
          <button key={val} onClick={() => setModo(val)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{ backgroundColor: modo===val ? C.verde : 'transparent', color: modo===val ? C.blanco : C.grisTexto }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filtros según modo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-wrap gap-4 items-end">
        {modo === 'mes' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seleccionar mes</label>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className={inputCls} />
          </div>
        ) : (
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seleccionar maestro</label>
            <select value={maestroId} onChange={e => setMaestroId(e.target.value)} className={`${inputCls} w-full`}>
              <option value="">— Elige un maestro —</option>
              {maestros.map(m => <option key={m.id} value={m.id}>{m.nombreCompleto}</option>)}
            </select>
          </div>
        )}
        {modo === 'mes' && (
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar maestro</label>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Filtrar por nombre..." className={`${inputCls} w-full`} />
          </div>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor:`${C.verde}30`, borderTopColor:C.verde }}/>
          <p className="text-sm font-medium animate-pulse" style={{ color: C.marron }}>Cargando reporte...</p>
        </div>
      ) : modo === 'mes' ? (
        /* ── Vista por Mes ── */
        <div className="rounded-2xl border-2 overflow-hidden shadow-sm" style={{ borderColor:`${C.verde}20` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.verdeClaro }}>
                  {['Maestro','NIP','Enfermedad (usado / saldo)','Personal (usado / saldo)','Permisos en el mes'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-black uppercase tracking-wide" style={{ color: C.verdeOscuro }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos
                  .filter(r => !busqueda || r.maestro?.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()))
                  .map((r, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-green-50/30 transition">
                    <td className="px-5 py-3 font-semibold" style={{ color: C.negro }}>{r.maestro?.nombreCompleto}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: C.marron }}>{r.maestro?.nipEscalafon}</td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-bold" style={{ color: C.verde }}>
                        {fmtT(r.saldo?.enfermedad?.usado)} / {fmtT(r.saldo?.enfermedad?.disponible)}
                      </p>
                      <Barra pct={r.saldo?.enfermedad?.porcentajeUsado||0} color={C.verde}/>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-bold" style={{ color: C.marron }}>
                        {fmtT(r.saldo?.personal?.usado)} / {fmtT(r.saldo?.personal?.disponible)}
                      </p>
                      <Barra pct={r.saldo?.personal?.porcentajeUsado||0} color={C.amarillo}/>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        {r.permisos?.map((p, pi) => (
                          <span key={pi} className="text-xs" style={{ color: C.grisTexto }}>
                            {new Date(p.fechaInicio).toLocaleDateString('es-SV',{day:'2-digit',month:'short',timeZone:'UTC'})} —
                            {p.tipo==='ENFERMEDAD'?'Enf.':'Pers.'} {[p.dias&&`${p.dias}d`,p.horas&&`${p.horas}h`,p.minutos&&`${p.minutos}m`].filter(Boolean).join(' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {datos.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay permisos en este mes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Vista por Maestro ── */
        datos.length > 0 && datos[0]?.maestro ? (
          <div className="space-y-4">
            {/* Info maestro */}
            <div className="rounded-2xl p-5 border-2 flex flex-col sm:flex-row sm:items-center gap-4" style={{ borderColor:`${C.verde}20`, backgroundColor: C.verdeClaro }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black" style={{ backgroundColor:`${C.verde}20`, color:C.verde }}>
                {datos[0].maestro?.nombreCompleto?.charAt(0)}
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: C.negro }}>{datos[0].maestro?.nombreCompleto}</p>
                <p className="text-sm font-medium" style={{ color: C.marron }}>NIP {datos[0].maestro?.nipEscalafon} · {datos[0].maestro?.tipoContratacion}</p>
              </div>
              <div className="sm:ml-auto flex gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase" style={{ color: C.grisTexto }}>Saldo Enfermedad</p>
                  <p className="font-mono font-bold text-sm" style={{ color: C.verde }}>{fmtT(datos[0].saldo?.enfermedad?.disponible)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase" style={{ color: C.grisTexto }}>Saldo Personal</p>
                  <p className="font-mono font-bold text-sm" style={{ color: C.marron }}>{fmtT(datos[0].saldo?.personal?.disponible)}</p>
                </div>
              </div>
            </div>

            {/* Permisos por mes */}
            {Object.entries(datos[0].meses || {}).map(([mesKey, permisos]) => {
              const [a, m] = mesKey.split('-');
              return (
                <div key={mesKey} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: C.verdeClaro }}>
                    <span className="font-bold text-sm" style={{ color: C.verdeOscuro }}>{MESES_ES[Number(m)-1]} {a}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor:`${C.verde}20`, color:C.verde }}>{permisos.length} permiso{permisos.length!==1?'s':''}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">
                      {['Tipo','Fecha inicio','Fecha fin','Días','Horas','Min.','Observación'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {permisos.map((p, pi) => (
                        <tr key={pi} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.tipo==='ENFERMEDAD'?'bg-purple-100 text-purple-700':'bg-cyan-100 text-cyan-700'}`}>{p.tipo==='ENFERMEDAD'?'Enfermedad':'Personal'}</span></td>
                          <td className="px-4 py-2 text-xs text-gray-600">{new Date(p.fechaInicio).toLocaleDateString('es-SV',{timeZone:'UTC'})}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{new Date(p.fechaFin).toLocaleDateString('es-SV',{timeZone:'UTC'})}</td>
                          <td className="px-4 py-2 text-center font-mono text-xs">{p.dias||'—'}</td>
                          <td className="px-4 py-2 text-center font-mono text-xs">{p.horas||'—'}</td>
                          <td className="px-4 py-2 text-center font-mono text-xs">{p.minutos||'—'}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{p.observacion||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {Object.keys(datos[0].meses||{}).length === 0 && (
              <div className="text-center py-12 text-gray-400 rounded-2xl border border-dashed border-gray-200">Este maestro no tiene permisos en el año activo</div>
            )}
          </div>
        ) : (
          !cargando && <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">{maestroId ? 'Sin datos' : 'Selecciona un maestro para ver su reporte'}</div>
        )
      )}
    </div>
  );
}