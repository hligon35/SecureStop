import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://example.invalid/api',
  timeout: 10000,
});
