import { API_BASE } from '../api';

// Gọi API bằng fetch (giống Lab08), tự gắn token đăng nhập của site chính (localStorage "tk")
export const call = async (path, { method = 'GET', body } = {}) => {
  const headers = {}, token = localStorage.getItem('tk');
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(API_BASE + '/api' + path, { method, headers, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
};

export const isLoggedIn = () => !!localStorage.getItem('tk');

// Chưa đăng nhập → chuyển sang trang đăng nhập của site chính
export const goLogin = () => { window.location.href = '/#auth'; };



