import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';
const SENSORS_URL = 'http://127.0.0.1:8000/api/sensors';

const LOGIN_URL = `${BASE_URL}login/`;
const REGISTER_URL = `${BASE_URL}register/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const NOTES_URL = `${BASE_URL}todos/`;
const AUTHENTICATED_URL = `${BASE_URL}authenticated/`;
const ROOMS_URL = `${SENSORS_URL}rooms/`;

axios.defaults.withCredentials = true; 

// Token kullanımı için interceptor
const sensorsApi = axios.create({
  baseURL: SENSORS_URL,
  withCredentials: true
});

// Her istekte token'ı ekle (eğer varsa)
sensorsApi.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Auth işlemleri
export const login = async (username, password) => {
    try {
        const response = await axios.post(
            LOGIN_URL, 
            { username, password },
            { withCredentials: true }
        );
        
        // Token'ı localStorage'a kaydedin
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        
        return response.data;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    }
};

export const get_notes = async () => {
    const response = await axios.get(NOTES_URL, { withCredentials: true });
    return response.data;
};

export const logout = async () => {
    const response = await axios.post(LOGOUT_URL, { withCredentials: true });
    // Token'ı temizle
    localStorage.removeItem('token');
    return response.data;
};

export const register = async (username, email, password) => {
    const response = await axios.post(REGISTER_URL, {username, email, password}, { withCredentials: true });
    return response.data;
};

export const authenticated_user = async () => {
    const response = await axios.get(AUTHENTICATED_URL, { withCredentials: true });
    return response.data;
};

// Oda API işlemleri
export const roomApi = {
    // Kullanıcının tüm odalarını getir
    getRooms: async () => {
        try {
            const response = await sensorsApi.get('/rooms/');
            return response.data;
        } catch (error) {
            console.error('Odaları getirirken hata oluştu:', error);
            throw error;
        }
    },
    
    // Bir odanın detaylarını getir
    getRoomDetails: async (roomId) => {
        try {
            const response = await sensorsApi.get(`/rooms/${roomId}/room_details/`);
            return response.data;
        } catch (error) {
            console.error(`Oda detaylarını getirirken hata oluştu (ID: ${roomId}):`, error);
            throw error;
        }
    },
    
    // Current status al (alternatif endpoint)
    getRoomStatus: async (roomId) => {
        try {
            const response = await sensorsApi.get(`/rooms/${roomId}/current_status/`);
            return response.data;
        } catch (error) {
            console.error(`Oda durumunu getirirken hata oluştu (ID: ${roomId}):`, error);
            throw error;
        }
    },
    
    // Valf kontrolü
    controlValve: async (roomId, status) => {
        try {
            const response = await sensorsApi.post(`/rooms/${roomId}/control_valve/`, {
                valve_status: status
            });
            return response.data;
        } catch (error) {
            console.error('Isıtma kontrolünde hata oluştu:', error);
            throw error;
        }
    },
    
    // Fan kontrolü
    controlFan: async (roomId, status) => {
        try {
            const response = await sensorsApi.post(`/rooms/${roomId}/control_fan/`, {
                fan_status: status
            });
            return response.data;
        } catch (error) {
            console.error('Fan kontrolünde hata oluştu:', error);
            throw error;
        }
    }
};

// Tüm API işlevlerini tek bir objede dışa aktar
export default {
    login,
    logout,
    register,
    get_notes,
    authenticated_user,
    roomApi
};