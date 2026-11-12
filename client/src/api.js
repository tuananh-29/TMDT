const B = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = B;

export const api = async (path, { method = 'GET', body, form } = {}) => {
  const h = {}, t = localStorage.getItem('tk');
  if (t) h.Authorization = 'Bearer ' + t;
  if (body) h['Content-Type'] = 'application/json';
  const r = await fetch(B + '/api' + path, {
    method,
    headers: h,
    body: form || (body && JSON.stringify(body))
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Có lỗi xảy ra');
  return d;
};
