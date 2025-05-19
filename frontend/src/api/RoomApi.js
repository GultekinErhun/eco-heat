// RoomApi.js - cookie tabanlı kimlik doğrulama ile
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/sensors';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // Cookie'leri gönder
});

export default {
  getRooms: () => api.get('/rooms/'),
  getRoomDetails: (roomId) => api.get(`/rooms/${roomId}/room_details/`),
  controlValve: (roomId, status) => api.post(`/rooms/${roomId}/control_valve/`, {
    valve_status: status
  }),
  controlFan: (roomId, status) => api.post(`/rooms/${roomId}/control_fan/`, {
    fan_status: status
  })
};