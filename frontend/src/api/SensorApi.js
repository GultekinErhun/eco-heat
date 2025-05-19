import axios from 'axios';

// API için temel URL'yi ayarlayın
const API_URL = 'http://127.0.0.1:8000/api/sensors/';

// Kimlik doğrulama token'ını localStorage'dan alın
const getToken = () => localStorage.getItem('token');

// API istekleri için yapılandırılmış bir axios instance'ı oluşturun
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekte Authorization header'ını ekleyen bir interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Oda ile ilgili API istekleri
export const roomService = {
  // Kullanıcının tüm odalarını getir
  getUserRooms: async () => {
    try {
      const response = await apiClient.get('/rooms/');
      return response.data;
    } catch (error) {
      console.error('Odaları getirirken hata oluştu:', error);
      throw error;
    }
  },

  // Belirli bir odanın detaylarını getir
  getRoomDetails: async (roomId) => {
    try {
      const response = await apiClient.get(`/rooms/${roomId}/room_details/`);
      return response.data;
    } catch (error) {
      console.error(`Oda detaylarını getirirken hata oluştu (ID: ${roomId}):`, error);
      throw error;
    }
  },

  // Isıtmayı kontrol et
  controlValve: async (roomId, status) => {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/control_valve/`, {
        valve_status: status
      });
      return response.data;
    } catch (error) {
      console.error('Isıtma kontrolünde hata oluştu:', error);
      throw error;
    }
  },

  // Fanı kontrol et
  controlFan: async (roomId, status) => {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/control_fan/`, {
        fan_status: status
      });
      return response.data;
    } catch (error) {
      console.error('Fan kontrolünde hata oluştu:', error);
      throw error;
    }
  }
};

export default {
  roomService,
};