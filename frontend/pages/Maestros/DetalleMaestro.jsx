import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaestro } from '../../services/maestrosService';
import { getPermisos, eliminarPermiso } from '../../services/permisosService';

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

function SaldoCard({ tipo, saldo }) {
  if (!saldo) return null;
  const { disponible, usado, porcentajeUsado, agotado } = saldo;
  const isEnf = tipo === 'ENFERMEDAD';
  const limite = isEnf ? '90 días' : '5 días';

  const esCritico = agotado || porcentajeUsado > 80;
  const esAdvertencia = !esCritico && porcentajeUsado > 60;

  const colorBarra = agotado ? C.marron : esAdvertencia ? C.amarillo : C.verde;
  const colorTextoDisponible = agotado ? C.marron : C.verde;
  const badgeBg = agotado ? C.marronClaro : esAdvertencia ? C.amarilloClaro : C.verdeClaro;
  const badgeColor = agotado ? C.marron : esAdvertencia ? C.marron : C.verdeOscuro;
  const badgeBorder = agotado ? `${C.marron}40` : esAdvertencia ? `${C.amarillo}60` : `${C.verde}30`;

  return (
    <div
      className="rounded-2xl p-5 border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: C.blanco,
        borderColor: esCritico ? `${C.amarillo}50` : `${C.verde}20`,
        boxShadow: esCritico ? `0 4px 20px ${C.amarillo}20` : 'none'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: C.marron }}>
            {isEnf ? 'Permiso por Enfermedad' : 'Permiso Personal'}
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: C.grisTexto }}>
            Límite: {limite} {isEnf ? 'con constancia médica' : 'con justificación'}
          </p>
        </div>
        <span
          className="text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide"
          style={{
            backgroundColor: badgeBg,
            color: badgeColor,
            borderColor: badgeBorder
          }}
        >
          {porcentajeUsado}% usado
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: C.gris }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(porcentajeUsado, 100)}%`,
            backgroundColor: colorBarra
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: C.gris, borderColor: C.grisMedio }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.grisTexto }}>Usado</p>
          <p className="font-mono font-bold text-sm" style={{ color: C.negro }}>{fmtTiempo(usado)}</p>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: C.blanco, borderColor: C.grisMedio }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.grisTexto }}>Disponible</p>
          <p className="font-mono font-bold text-sm" style={{ color: colorTextoDisponible }}>
            {agotado ? 'Agotado' : fmtTiempo(disponible)}
          </p>
        </div>
      </div>
    </div>
  );
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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
    const tiempo = fmtTiempo({ dias: permiso.dias, horas: permiso.horas, minutos: permiso.minutos });
    if (!confirm(`¿Eliminar este permiso de ${tiempo}?\n\nEl saldo del maestro será restaurado.`)) return;
    setEliminando(permiso.id);
    try {
      await eliminarPermiso(permiso.id);
      setPermisos(p => p.filter(x => x.id !== permiso.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el permiso');
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
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${C.verde}30`, borderTopColor: C.verde }} />
      <p className="text-sm font-medium animate-pulse" style={{ color: C.marron }}>Cargando información...</p>
    </div>
  );

  if (!maestro) return (
    <div className="text-center py-20 rounded-2xl border-2 border-dashed" style={{ borderColor: `${C.marron}30`, backgroundColor: C.marronClaro }}>
      <p className="font-bold text-lg" style={{ color: C.marron }}>Maestro no encontrado</p>
      <button
        onClick={() => navigate('/maestros')}
        className="mt-3 text-sm font-bold underline underline-offset-4 transition hover:opacity-70"
        style={{ color: C.verde }}
      >
        Volver a la lista
      </button>
    </div>
  );

  const now = new Date();
  const mesesOpciones = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${now.getFullYear()}-${m}`, label: MESES[i] };
  });

  const inputSelectCls = "rounded-xl px-3 py-2.5 text-sm border-2 bg-white text-black outline-none transition-all duration-200 hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_3px_rgba(36,136,66,0.12)] appearance-none cursor-pointer pr-8";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Breadcrumb + Header */}
      <div>
        <button
          onClick={() => navigate('/maestros')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 transition-colors hover:underline"
          style={{ color: C.marron }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Maestros
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: `${C.verde}15`, border: `2px solid ${C.verde}25` }}
            >
              <span className="font-black text-2xl" style={{ color: C.verde }}>{maestro.nombreCompleto.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: C.negro }}>{maestro.nombreCompleto}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: C.gris, color: C.marron }}>
                  NIP {maestro.nipEscalafon}
                </span>
                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: C.grisTexto }} />
                <span className="text-xs font-medium" style={{ color: C.grisTexto }}>{maestro.tipoContratacion}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/permisos/nuevo?maestroId=${id}`)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 shrink-0"
            style={{
              backgroundColor: C.verde,
              color: C.blanco,
              boxShadow: '0 4px 14px rgba(36,136,66,0.35)'
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
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
          <h2 className="text-lg font-black" style={{ color: C.verde }}>Historial de permisos</h2>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <select
                value={mesFiltro}
                onChange={e => setMesFiltro(e.target.value)}
                className={inputSelectCls}
                style={{ borderColor: mesFiltro ? `${C.verde}50` : C.grisMedio }}
              >
                <option value="">Todos los meses</option>
                {mesesOpciones.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value)}
                className={inputSelectCls}
                style={{ borderColor: tipoFiltro ? `${C.verde}50` : C.grisMedio }}
              >
                <option value="">Todos</option>
                <option value="ENFERMEDAD">Enfermedad</option>
                <option value="PERSONAL">Personal</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {(mesFiltro || tipoFiltro) && (
              <button
                onClick={() => { setMesFiltro(''); setTipoFiltro(''); }}
                className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                style={{ color: C.marron }}
                title="Limpiar filtros"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {permisosFiltrados.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: `${C.verde}25`, backgroundColor: C.verdeClaro }}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.verde}15` }}>
              <svg className="w-7 h-7" style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-bold" style={{ color: C.marron }}>
              {permisos.length === 0 ? 'No hay permisos registrados' : 'Ningún permiso coincide con los filtros'}
            </p>
            <p className="text-xs mt-1" style={{ color: C.marron, opacity: 0.7 }}>
              {permisos.length === 0 ? 'Los permisos aparecerán aquí una vez registrados' : 'Prueba con otros filtros o limpia la búsqueda'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {permisosFiltrados.map((p, idx) => {
              const fecha = new Date(p.fechaInicio).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
              const isEnf = p.tipo === 'ENFERMEDAD';

              return (
                <div
                  key={p.id}
                  className="group rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 transition-all duration-200 border-2 hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    backgroundColor: C.blanco,
                    borderColor: `${C.verde}15`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${C.verde}40`; e.currentTarget.style.backgroundColor = C.verdeClaro; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${C.verde}15`; e.currentTarget.style.backgroundColor = C.blanco; }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide"
                      style={{
                        backgroundColor: isEnf ? C.verdeClaro : C.amarilloClaro,
                        color: isEnf ? C.verdeOscuro : C.marron,
                        borderColor: isEnf ? `${C.verde}30` : `${C.amarillo}50`
                      }}
                    >
                      {isEnf ? 'Enfermedad' : 'Personal'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-sm" style={{ color: C.negro }}>
                        {fmtTiempo({ dias: p.dias, horas: p.horas, minutos: p.minutos })}
                      </p>
                      <p className="text-xs font-medium truncate" style={{ color: C.grisTexto }}>
                        {fecha}{p.observacion ? ` · ${p.observacion}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-medium hidden sm:block" style={{ color: C.grisTexto }}>
                      por <span className="font-bold" style={{ color: C.marron }}>{p.creadoPor}</span>
                    </span>
                    <button
                      onClick={() => handleEliminar(p)}
                      disabled={eliminando === p.id}
                      className="p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 disabled:opacity-50"
                      style={{ color: C.marron }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.marronClaro; e.currentTarget.style.color = C.marron; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.marron; }}
                      title="Eliminar permiso"
                    >
                      {eliminando === p.id ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
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