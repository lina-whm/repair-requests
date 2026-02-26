import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getUsers = () => API.get('/users');
export const getRequests = () => API.get('/requests');
export const createRequest = (data: any) => API.post('/requests', data);
export const assignMaster = (id: number, masterId: number) => 
  API.post(`/requests/${id}/assign`, { masterId });
export const cancelRequest = (id: number) => 
  API.post(`/requests/${id}/cancel`);
export const takeRequest = (id: number, masterId: number) => 
  API.post(`/requests/${id}/take`, { masterId });
export const completeRequest = (id: number, masterId: number) => 
  API.post(`/requests/${id}/complete`, { masterId });

export default API;