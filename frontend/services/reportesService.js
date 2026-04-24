import api from './api';

export const getResumen = () =>
  api.get('/reportes/resumen').then(r => r.data);

export const exportarExcel = async () => {
  const res = await api.get('/reportes/excel', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `permisos_brasil_${new Date().getFullYear()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
