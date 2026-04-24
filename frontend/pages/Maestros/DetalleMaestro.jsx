import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaestro } from '../../services/maestrosService';
import { getPermisos, eliminarPermiso } from '../../services/permisosService';

function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const p = [];
  if (dias) p.push(`${dias}d`);
  if (horas) p.push(`${horas}h`);
  if (minutos) p.push(`${minutos}m`);
  return p.join(' ') || '0m';
}

function SaldoCard({ tipo, saldo }) {
  if (!saldo) return null;
  const { disponible, usado, porcentajeUsado, agotado } = saldo;
  const isEnf = tipo === 'ENFERMEDAD';
  const color = agotado ? 'red' : porcentajeUsado > 70 ? 'amber' : 'emerald';
  const colorMap = {
    red: { bar: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20', ring: 'ring-red-500/20' },
    amber: { bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', ring: 'ring-amber-500/20' },
    emerald: { bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ring: 'ring-emerald-500/20' },
  };
  const c = colorMap[color];
  const limite = isEnf ? '90 días' : '5 días';

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 ring-1 ${c.ring}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            {isEnf ? 'Permiso por Enfermedad' : 'Permiso Personal'}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">Límite: {limite} con {isEnf ? 'constancia médica' : 'justificación'}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${c.badge}`}>
          {porcentajeUsado}% usado
        </span>
      </div>
      <div className="bg-slate-700 rounded-full h-2 mb-3">
        <div className={`${c.bar} h-2 rounded-full transition-all`} style={{ width: `${Math.min(porcentajeUsado, 100)}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-0.5">Usado</p>
          <p className="text-white font-mono font-semibold">{fmtTiempo(usado)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-400 mb-0.5">Disponible</p>
          <p className={`font-mono font-semibold ${agotado ? 'text-red-400' : 'text-emerald-400'}`}>{agotado ? 'Agotado' : fmtTiempo(disponible)}</p>
        </div>
      </div>
    </div>
  );
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function DetalleMaestro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maestro, setMaestro] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mesFiltro, setMesFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    Promise.all([getMaestro(id), getPermisos({ maestroId: id })])
      .then(([m, p]) => { setMaestro(m); setPermisos(p); })
      .finally(() => setCargando(false));
  }, [id]);

  const handleEliminar = async (permiso) => {
    if (!confirm(`¿Eliminar este permiso de ${fmtTiempo({ dias: permiso.dias, horas: permiso.horas, minutos: permiso.minutos })}? El saldo será restaurado.`)) return;
    setEliminando(permiso.id);
    try {
      await eliminarPermiso(permiso.id);
      setPermisos(p => p.filter(x => x.id !== permiso.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const permisosFiltrados = permisos.filter(p => {
    const okTipo = !tipoFiltro || p.tipo === tipoFiltro;
    const okMes = !mesFiltro || p.fechaInicio.startsWith(mesFiltro);
    return okTipo && okMes;
  });

  if (cargando) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!maestro) return <p className="text-red-400">Maestro no encontrado</p>;

  const now = new Date();
  const mesesOpciones = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${now.getFullYear()}-${m}`, label: MESES[i] };
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <button onClick={() => navigate('/maestros')} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Maestros
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-xl">{maestro.nombreCompleto.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{maestro.nombreCompleto}</h1>
              <p className="text-slate-400 text-sm">NIP {maestro.nipEscalafon} · {maestro.tipoContratacion}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/permisos/nuevo?maestroId=${id}`)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-500/20 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Registrar permiso
          </button>
        </div>
      </div>

      {/* Saldos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <SaldoCard tipo="ENFERMEDAD" saldo={maestro.saldo?.enfermedad} />
        <SaldoCard tipo="PERSONAL" saldo={maestro.saldo?.personal} />
      </div>

      {/* Historial de permisos */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-white">Historial de permisos</h2>
          <div className="flex gap-2">
            <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500">
              <option value="">Todos los meses</option>
              {mesesOpciones.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500">
              <option value="">Todos</option>
              <option value="ENFERMEDAD">Enfermedad</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>
        </div>

        {permisosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <p>No hay permisos registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {permisosFiltrados.map(p => {
              const fecha = new Date(p.fechaInicio).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
              const isEnf = p.tipo === 'ENFERMEDAD';
              return (
                <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg border ${isEnf ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                      {isEnf ? 'Enferm.' : 'Personal'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-mono font-semibold">{fmtTiempo({ dias: p.dias, horas: p.horas, minutos: p.minutos })}</p>
                      <p className="text-slate-400 text-xs">{fecha}{p.observacion ? ` · ${p.observacion}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">por {p.creadoPor}</span>
                    <button
                      onClick={() => handleEliminar(p)}
                      disabled={eliminando === p.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
