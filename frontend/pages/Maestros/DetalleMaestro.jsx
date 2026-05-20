import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaestro, actualizarMaestro } from '../../services/maestrosService';
import { desactivarMaestro, eliminarMaestroPermanente } from '../../services/maestrosService';
import { getPermisos, eliminarPermiso } from '../../services/permisosService';
import api from '../../services/api';

const C = {
  verde: '#248842', verdeOscuro: '#1a6b32', verdeClaro: '#e8f5ec',
  amarillo: '#FAD327', amarilloClaro: '#fef9e0',
  marron: '#7A3F25', marronClaro: '#f5ebe6',
  blanco: '#FFFFFF', negro: '#000000',
  gris: '#f5f5f5', grisMedio: '#e5e5e5', grisTexto: '#666666',
  rojo: '#dc2626', rojoClaro: '#fef2f2',
};

function fmtTiempo({ dias = 0, horas = 0, minutos = 0 } = {}) {
  const p = [];
  if (dias)    p.push(`${dias}d`);
  if (horas)   p.push(`${horas}h`);
  if (minutos) p.push(`${minutos}m`);
  return p.join(' ') || '0m';
}

// ── Modal Editar Maestro ──────────────────────────────────────────────────────
function ModalEditar({ maestro, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nipEscalafon:     maestro.nipEscalafon,
    nombreCompleto:   maestro.nombreCompleto,
    tipoContratacion: maestro.tipoContratacion,
  });
  const [error,    setError]    = useState('');
  const [guardando, setGuardando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setGuardando(true);
    try {
      const actualizado = await actualizarMaestro(maestro.id, form);
      onGuardado(actualizado);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los cambios');
    } finally { setGuardando(false); }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm border-2 border-gray-200 bg-white text-black outline-none transition-all hover:border-[#248842] focus:border-[#248842] focus:shadow-[0_0_0_3px_rgba(36,136,66,0.15)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        style={{ backgroundColor: C.blanco, border: `2px solid ${C.verde}` }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.verde }}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Maestro
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl p-3 text-sm border-l-4"
              style={{ backgroundColor: C.marronClaro, borderColor: C.marron, color: C.marron }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: C.marron }}>
                NIP / Escalafón <span className="text-red-500">*</span>
              </label>
              <input required value={form.nipEscalafon}
                onChange={e => setForm(f => ({ ...f, nipEscalafon: e.target.value }))}
                className={inputCls} placeholder="Ej. 12345" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: C.marron }}>
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input required value={form.nombreCompleto}
                onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
                className={inputCls} placeholder="Apellido Apellido, Nombre" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: C.marron }}>
                Tipo de contratación
              </label>
              <div className="relative">
                <select value={form.tipoContratacion}
                  onChange={e => setForm(f => ({ ...f, tipoContratacion: e.target.value }))}
                  className={`${inputCls} appearance-none cursor-pointer`}>
                  <option>Sueldo Base</option>
                  <option>Sobre Sueldo</option>
                  <option>Horas Clase</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                style={{ backgroundColor: C.gris, color: C.marron }}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: C.verde }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Modal Confirmación Desactivar / Eliminar ──────────────────────────────────
function ModalConfirmarEliminar({ maestro, puedeEliminarPermanente, onClose, onConfirmado }) {
  // Doble confirmación: primero aviso, luego escribe el nombre
  const [paso, setPaso]           = useState(1);
  const [confirmacion, setConf]   = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError]         = useState('');

  const accion    = puedeEliminarPermanente ? 'ELIMINAR' : 'DESACTIVAR';
  const textoEsperado = maestro.nombreCompleto.toUpperCase();

  const confirmar = async () => {
    if (paso === 1) { setPaso(2); return; }
    // Paso 2: validar que escribió el nombre exacto
    if (confirmacion.toUpperCase().trim() !== textoEsperado) {
      setError('El nombre no coincide. Escríbelo exactamente como aparece.');
      return;
    }
    setProcesando(true);
    try {
      if (puedeEliminarPermanente) {
        await eliminarMaestroPermanente(maestro.id); // DELETE
      } else {
        await desactivarMaestro(maestro.id); // PATCH desactivar
      }
      onConfirmado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la acción');
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: C.blanco, border: `2px solid ${C.rojo}` }}>

        {/* Header rojo */}
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ backgroundColor: C.rojo }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {puedeEliminarPermanente ? 'Eliminar permanentemente' : 'Desactivar maestro'}
            </h2>
            <p className="text-xs text-white/80">
              {puedeEliminarPermanente
                ? 'Esta acción no se puede deshacer'
                : 'El historial de permisos se conservará'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Paso 1 — Aviso */}
          {paso === 1 && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 border-2" style={{ backgroundColor: C.rojoClaro, borderColor: `${C.rojo}30` }}>
                {puedeEliminarPermanente ? (
                  <div className="space-y-2 text-sm" style={{ color: C.rojo }}>
                    <p className="font-bold">⚠️ Este maestro lleva más de 3 meses inactivo.</p>
                    <p>Al eliminarlo permanentemente se borrarán <strong>todos sus datos</strong> del sistema incluyendo su historial de permisos.</p>
                    <p>Solo hazlo si el MINED ya no necesitará esa información.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm" style={{ color: C.rojo }}>
                    <p className="font-bold">¿Seguro que quieres desactivar a este maestro?</p>
                    <p>El maestro <strong>{maestro.nombreCompleto}</strong> quedará inactivo y no aparecerá en las listas.</p>
                    <p>Su historial de permisos <strong>se conservará</strong> para reportes al MINED.</p>
                    <p className="text-xs opacity-70">Si lleva más de 3 meses inactivo, podrás eliminarlo permanentemente.</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl p-3 border" style={{ backgroundColor: C.gris }}>
                <p className="text-xs font-medium" style={{ color: C.grisTexto }}>Maestro:</p>
                <p className="font-bold text-sm mt-0.5" style={{ color: C.negro }}>{maestro.nombreCompleto}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: C.marron }}>NIP {maestro.nipEscalafon}</p>
              </div>
            </div>
          )}

          {/* Paso 2 — Escribir el nombre para confirmar */}
          {paso === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: C.negro }}>
                Para confirmar, escribe el nombre completo del maestro exactamente como aparece:
              </p>
              <div className="rounded-xl p-3 border font-mono text-sm font-bold text-center"
                style={{ backgroundColor: C.gris, borderColor: C.grisMedio, color: C.negro }}>
                {maestro.nombreCompleto.toUpperCase()}
              </div>
              <input
                value={confirmacion}
                onChange={e => { setConf(e.target.value); setError(''); }}
                className="w-full rounded-xl px-4 py-3 text-sm border-2 bg-white text-black outline-none transition focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]"
                style={{ borderColor: error ? C.rojo : C.grisMedio }}
                placeholder="Escribe el nombre aquí..."
                autoFocus
              />
              {error && (
                <p className="text-xs font-medium" style={{ color: C.rojo }}>{error}</p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={procesando}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition"
              style={{ backgroundColor: C.gris, color: C.marron }}>
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={procesando || (paso === 2 && !confirmacion.trim())}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ backgroundColor: C.rojo }}>
              {procesando ? 'Procesando...' : paso === 1 ? 'Continuar →' : accion}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SaldoCard ─────────────────────────────────────────────────────────────────
function SaldoCard({ tipo, saldo }) {
  if (!saldo) return null;
  const { disponible, usado, porcentajeUsado, agotado } = saldo;
  const isEnf = tipo === 'ENFERMEDAD';

  const esCritico   = agotado || porcentajeUsado > 80;
  const esAdvertencia = !esCritico && porcentajeUsado > 60;
  const colorBarra  = agotado ? C.marron : esAdvertencia ? C.amarillo : C.verde;

  return (
    <div className="rounded-2xl p-5 border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ backgroundColor: C.blanco, borderColor: esCritico ? `${C.amarillo}50` : `${C.verde}20` }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: C.marron }}>
            {isEnf ? 'Permiso por Enfermedad' : 'Permiso Personal'}
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: C.grisTexto }}>
            Límite: {isEnf ? '90 días con constancia médica' : '5 días sin justificación'}
          </p>
        </div>
        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide"
          style={{
            backgroundColor: agotado ? C.marronClaro : esAdvertencia ? C.amarilloClaro : C.verdeClaro,
            color: agotado ? C.marron : esAdvertencia ? C.marron : C.verdeOscuro,
            borderColor: agotado ? `${C.marron}40` : esAdvertencia ? `${C.amarillo}60` : `${C.verde}30`,
          }}>
          {porcentajeUsado}% usado
        </span>
      </div>

      <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: C.gris }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(porcentajeUsado, 100)}%`, backgroundColor: colorBarra }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: C.gris, borderColor: C.grisMedio }}>
          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: C.grisTexto }}>Usado</p>
          <p className="font-mono font-bold text-sm" style={{ color: C.negro }}>{fmtTiempo(usado)}</p>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: C.blanco, borderColor: C.grisMedio }}>
          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: C.grisTexto }}>Disponible</p>
          <p className="font-mono font-bold text-sm" style={{ color: agotado ? C.marron : C.verde }}>
            {agotado ? 'Agotado' : fmtTiempo(disponible)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── DetalleMaestro (componente principal) ─────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function DetalleMaestro() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [maestro, setMaestro]     = useState(null);
  const [permisos, setPermisos]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [mesFiltro, setMesFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [modalEditar,   setModalEditar]   = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: ano } = await api.get('/reportes/ano-activo');
        const [m, resPermisos] = await Promise.all([
          getMaestro(id, ano.id),
          getPermisos({ maestroId: id, limite: 200 }),
        ]);
        setMaestro(m);
        setPermisos(resPermisos.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  // ¿Puede eliminarse permanentemente? Solo si lleva más de 3 meses inactivo
  const puedeEliminarPermanente = maestro && !maestro.activo && (() => {
    const updatedAt = new Date(maestro.updatedAt);
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    return updatedAt < tresMesesAtras;
  })();

  const handleEliminarPermiso = async (permiso) => {
    const tiempo = fmtTiempo({ dias: permiso.dias, horas: permiso.horas, minutos: permiso.minutos });
    if (!confirm(`¿Eliminar este permiso de ${tiempo}?\n\nEl saldo del maestro será restaurado.`)) return;
    setEliminando(permiso.id);
    try {
      await eliminarPermiso(permiso.id);
      setPermisos(p => p.filter(x => x.id !== permiso.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el permiso');
    } finally { setEliminando(null); }
  };

  const handleConfirmadoEliminar = () => {
    // Si fue eliminado permanentemente, volver a la lista
    // Si fue desactivado, recargar para mostrar el badge inactivo
    navigate('/maestros');
  };

  const permisosFiltrados = permisos.filter(p => {
    const okTipo = !tipoFiltro || p.tipo === tipoFiltro;
    const okMes  = !mesFiltro  || p.fechaInicio.slice(0, 7) === mesFiltro;
    return okTipo && okMes;
  });

  const inputSelectCls = "rounded-xl px-3 py-2.5 text-sm border-2 bg-white text-black outline-none transition hover:border-[#248842] focus:border-[#248842] appearance-none cursor-pointer pr-8";

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: `${C.verde}30`, borderTopColor: C.verde }} />
      <p className="text-sm font-medium animate-pulse" style={{ color: C.marron }}>Cargando información...</p>
    </div>
  );

  if (!maestro) return (
    <div className="text-center py-20 rounded-2xl border-2 border-dashed"
      style={{ borderColor: `${C.marron}30`, backgroundColor: C.marronClaro }}>
      <p className="font-bold text-lg" style={{ color: C.marron }}>Maestro no encontrado</p>
      <button onClick={() => navigate('/maestros')}
        className="mt-3 text-sm font-bold underline underline-offset-4"
        style={{ color: C.verde }}>
        Volver a la lista
      </button>
    </div>
  );

  const now = new Date();
  const mesesOpciones = Array.from({ length: 12 }, (_, i) => ({
    value: `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
    label: MESES[i],
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* Breadcrumb */}
      <button onClick={() => navigate('/maestros')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
        style={{ color: C.marron }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Maestros
      </button>

      {/* Header con nombre + acciones */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: `${C.verde}15`, border: `2px solid ${C.verde}25` }}>
            <span className="font-black text-2xl" style={{ color: C.verde }}>
              {maestro.nombreCompleto.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight" style={{ color: C.negro }}>
                {maestro.nombreCompleto}
              </h1>
              {/* Badge activo / inactivo */}
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide"
                style={{
                  backgroundColor: maestro.activo ? C.verdeClaro : C.marronClaro,
                  color:           maestro.activo ? C.verdeOscuro : C.marron,
                  borderColor:     maestro.activo ? `${C.verde}30` : `${C.marron}30`,
                }}>
                {maestro.activo ? '● Activo' : '○ Inactivo'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: C.gris, color: C.marron }}>
                NIP {maestro.nipEscalafon}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: C.grisTexto }} />
              <span className="text-xs font-medium" style={{ color: C.grisTexto }}>
                {maestro.tipoContratacion}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Registrar permiso — solo si está activo */}
          {maestro.activo && (
            <button onClick={() => navigate(`/permisos/nuevo?maestroId=${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: C.verde }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Registrar permiso
            </button>
          )}

          {/* Editar */}
          <button onClick={() => setModalEditar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition hover:shadow-md"
            style={{ backgroundColor: C.amarillo, color: C.negro }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>

          {/* Desactivar / Eliminar */}
          <button onClick={() => setModalEliminar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:shadow-md hover:opacity-90"
            style={{ backgroundColor: C.rojo }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {puedeEliminarPermanente
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              }
            </svg>
            {puedeEliminarPermanente ? 'Eliminar' : 'Desactivar'}
          </button>
        </div>
      </div>

      {/* Aviso si está inactivo y puede eliminarse */}
      {!maestro.activo && (
        <div className="rounded-2xl p-4 border-2 flex items-start gap-3"
          style={{ backgroundColor: puedeEliminarPermanente ? C.rojoClaro : C.amarilloClaro,
                   borderColor: puedeEliminarPermanente ? `${C.rojo}30` : `${C.amarillo}50` }}>
          <svg className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: puedeEliminarPermanente ? C.rojo : C.marron }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-bold"
              style={{ color: puedeEliminarPermanente ? C.rojo : C.marron }}>
              {puedeEliminarPermanente
                ? 'Este maestro lleva más de 3 meses inactivo y puede eliminarse permanentemente.'
                : 'Este maestro está desactivado. Sus permisos históricos se conservan para el MINED.'}
            </p>
            {!puedeEliminarPermanente && (
              <p className="text-xs mt-1" style={{ color: C.marron, opacity: 0.8 }}>
                Pasados 3 meses de inactividad aparecerá la opción de eliminación permanente.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Saldos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <SaldoCard tipo="ENFERMEDAD" saldo={maestro.saldo?.enfermedad} />
        <SaldoCard tipo="PERSONAL"   saldo={maestro.saldo?.personal} />
      </div>

      {/* Historial de permisos */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-black" style={{ color: C.verde }}>
            Historial de permisos
            <span className="ml-2 text-sm font-medium" style={{ color: C.grisTexto }}>
              ({permisosFiltrados.length} registro{permisosFiltrados.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                className={inputSelectCls}
                style={{ borderColor: mesFiltro ? `${C.verde}50` : C.grisMedio }}>
                <option value="">Todos los meses</option>
                {mesesOpciones.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
                className={inputSelectCls}
                style={{ borderColor: tipoFiltro ? `${C.verde}50` : C.grisMedio }}>
                <option value="">Todos</option>
                <option value="ENFERMEDAD">Enfermedad</option>
                <option value="PERSONAL">Personal</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: C.verde }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {(mesFiltro || tipoFiltro) && (
              <button onClick={() => { setMesFiltro(''); setTipoFiltro(''); }}
                className="p-2 rounded-lg transition hover:scale-110" style={{ color: C.marron }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {permisosFiltrados.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed"
            style={{ borderColor: `${C.verde}25`, backgroundColor: C.verdeClaro }}>
            <p className="font-bold" style={{ color: C.marron }}>
              {permisos.length === 0 ? 'No hay permisos registrados' : 'Ningún permiso coincide con los filtros'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {permisosFiltrados.map((p) => {
              const fecha = new Date(p.fechaInicio).toLocaleDateString('es-SV', {
                day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
              });
              const isEnf = p.tipo === 'ENFERMEDAD';
              return (
                <div key={p.id}
                  className="group rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 border-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: C.blanco, borderColor: `${C.verde}15` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.verde}40`; e.currentTarget.style.backgroundColor = C.verdeClaro; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.verde}15`; e.currentTarget.style.backgroundColor = C.blanco; }}>

                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide"
                      style={{
                        backgroundColor: isEnf ? C.verdeClaro : C.amarilloClaro,
                        color:           isEnf ? C.verdeOscuro : C.marron,
                        borderColor:     isEnf ? `${C.verde}30` : `${C.amarillo}50`,
                      }}>
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
                    <button onClick={() => handleEliminarPermiso(p)} disabled={eliminando === p.id}
                      className="p-2 rounded-lg transition opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50"
                      style={{ color: C.marron }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.marronClaro; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title="Eliminar permiso">
                      {eliminando === p.id
                        ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalEditar && (
        <ModalEditar
          maestro={maestro}
          onClose={() => setModalEditar(false)}
          onGuardado={(actualizado) => setMaestro(m => ({ ...m, ...actualizado }))}
        />
      )}
      {modalEliminar && (
        <ModalConfirmarEliminar
          maestro={maestro}
          puedeEliminarPermanente={puedeEliminarPermanente}
          onClose={() => setModalEliminar(false)}
          onConfirmado={handleConfirmadoEliminar}
        />
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}