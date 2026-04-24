import api from './api';

export const getMaestros = (anoEscolarId) =>
  api.get('/maestros', { params: anoEscolarId ? { anoEscolarId } : {} }).then(r => r.data);

export const getMaestro = (id) =>
  api.get(`/maestros/${id}`).then(r => r.data);

export const crearMaestro = (data) =>
  api.post('/maestros', data).then(r => r.data);

export const actualizarMaestro = (id, data) =>
  api.put(`/maestros/${id}`, data).then(r => r.data);
