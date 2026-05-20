import api from './api';

export const getMaestros = (params = {}) =>
  api.get('/maestros', { params }).then(r => r.data);

export const getMaestro = (id, anoEscolarId) =>
  api.get(`/maestros/${id}`, { params: anoEscolarId ? { anoEscolarId } : {} }).then(r => r.data);

export const crearMaestro = (data) =>
  api.post('/maestros', data).then(r => r.data);

export const actualizarMaestro = (id, data) =>
  api.put(`/maestros/${id}`, data).then(r => r.data);

// ✅ NUEVO: Soft-delete (desactivar)
export const desactivarMaestro = (id) =>
  api.patch(`/maestros/${id}/desactivar`).then(r => r.data);

// ✅ NUEVO: Reactivar
export const reactivarMaestro = (id) =>
  api.patch(`/maestros/${id}/reactivar`).then(r => r.data);

// ✅ NUEVO: Eliminación permanente (solo después de 3 meses)
export const eliminarMaestroPermanente = (id) =>
  api.delete(`/maestros/${id}`).then(r => r.data);