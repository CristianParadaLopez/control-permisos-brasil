import api from './api';

export const getPermisos = (params) =>
  api.get('/permisos', { params }).then(r => r.data);

export const crearPermiso = (data) =>
  api.post('/permisos', data).then(r => r.data);

export const eliminarPermiso = (id) =>
  api.delete(`/permisos/${id}`).then(r => r.data);
