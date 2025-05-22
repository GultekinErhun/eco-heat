import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';
const SENSORS_URL = 'http://127.0.0.1:8000/api/sensors';
const SCHEDULES_URL = 'http://127.0.0.1:8000/api/schedules';

const LOGIN_URL = `${BASE_URL}login/`;
const REGISTER_URL = `${BASE_URL}register/`;
const LOGOUT_URL = `${BASE_URL}logout/`;
const NOTES_URL = `${BASE_URL}todos/`;
const AUTHENTICATED_URL = `${BASE_URL}authenticated/`;
const ROOMS_URL = `${SENSORS_URL}/rooms/`;

axios.defaults.withCredentials = true; 

// Token kullanımı için interceptor
const sensorsApi = axios.create({
  baseURL: SENSORS_URL,
  withCredentials: true
});

// Schedule API için interceptor
const schedulesApi = axios.create({
  baseURL: SCHEDULES_URL,
  withCredentials: true
});

// Her istekte token'ı ekle (eğer varsa)
const addTokenToRequest = function (config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

sensorsApi.interceptors.request.use(addTokenToRequest, function (error) {
  return Promise.reject(error);
});

schedulesApi.interceptors.request.use(addTokenToRequest, function (error) {
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
    controlValve: async (roomId, mode) => {
        try {
            const response = await sensorsApi.post(`/rooms/${roomId}/control_valve/`, {
                mode: mode // "on", "off" veya "schedule"
            });
            return response.data;
        } catch (error) {
            console.error('Isıtma kontrolünde hata oluştu:', error);
            throw error;
        }
    },
    
    // Fan kontrolü
    controlFan: async (roomId, mode) => {
        try {
            const response = await sensorsApi.post(`/rooms/${roomId}/control_fan/`, {
                mode: mode // "on", "off" veya "schedule"
            });
            return response.data;
        } catch (error) {
            console.error('Fan kontrolünde hata oluştu:', error);
            throw error;
        }
    },
    
    // Odanın kontrol modlarını getir
    getRoomControlModes: async (roomId) => {
        try {
            const response = await sensorsApi.get(`/rooms/${roomId}/control_modes/`);
            return response.data;
        } catch (error) {
            console.error(`Oda kontrol modlarını getirirken hata oluştu (ID: ${roomId}):`, error);
            throw error;
        }
    },
    
    // Odanın programlarını getir
    getRoomSchedules: async (roomId) => {
        try {
            const response = await sensorsApi.get(`/rooms/${roomId}/schedules/`);
            return response.data;
        } catch (error) {
            console.error(`Oda programlarını getirirken hata oluştu (ID: ${roomId}):`, error);
            throw error;
        }
    }
};

// Schedule API işlemleri
export const scheduleApi = {
    // Tüm programları getir
    getSchedules: async () => {
        try {
            const response = await schedulesApi.get('/schedules/');
            return response.data;
        } catch (error) {
            console.error('Programları getirirken hata oluştu:', error);
            throw error;
        }
    },
    
    // Belirli bir programın detaylarını getir
    getScheduleDetails: async (scheduleId) => {
        try {
            const response = await schedulesApi.get(`/schedules/${scheduleId}/detailed/`);
            return response.data;
        } catch (error) {
            console.error(`Program detaylarını getirirken hata oluştu (ID: ${scheduleId}):`, error);
            throw error;
        }
    },
    
    // Yeni program oluştur
    createSchedule: async (name, description = '') => {
        try {
            const response = await schedulesApi.post('/schedules/', {
                name,
                description
            });
            return response.data;
        } catch (error) {
            console.error('Program oluştururken hata oluştu:', error);
            throw error;
        }
    },
    
    // Programı güncelle
    updateSchedule: async (scheduleId, data) => {
        try {
            const response = await schedulesApi.put(`/schedules/${scheduleId}/`, data);
            return response.data;
        } catch (error) {
            console.error(`Programı güncellerken hata oluştu (ID: ${scheduleId}):`, error);
            throw error;
        }
    },
    
    // Programı sil
    deleteSchedule: async (scheduleId) => {
        try {
            await schedulesApi.delete(`/schedules/${scheduleId}/`);
            return true;
        } catch (error) {
            console.error(`Programı silerken hata oluştu (ID: ${scheduleId}):`, error);
            throw error;
        }
    },
    
    // Programı bir odaya ata
    assignScheduleToRoom: async (scheduleId, roomId) => {
        try {
            const response = await schedulesApi.post(`/schedules/${scheduleId}/assign_to_room/`, {
                room_id: roomId
            });
            return response.data;
        } catch (error) {
            console.error(`Programı odaya atarken hata oluştu (Schedule ID: ${scheduleId}, Room ID: ${roomId}):`, error);
            throw error;
        }
    },
    
    // Program için zaman dilimlerini güncelle
    updateTimeSlots: async (scheduleId, timeSlots) => {
        try {
            const response = await schedulesApi.post(`/schedules/${scheduleId}/update_time_slots/`, {
                time_slots: timeSlots
            });
            return response.data;
        } catch (error) {
            console.error(`Zaman dilimlerini güncellerken hata oluştu (ID: ${scheduleId}):`, error);
            throw error;
        }
    }
};

// Günler API işlemleri
export const dayApi = {
    // Tüm günleri getir
    getDays: async () => {
        try {
            const response = await schedulesApi.get('/days/');
            return response.data;
        } catch (error) {
            console.error('Günleri getirirken hata oluştu:', error);
            throw error;
        }
    }
};

// Saat dilimleri API işlemleri
export const hourApi = {
    // Tüm saat dilimlerini getir
    getHours: async () => {
        try {
            const response = await schedulesApi.get('/hours/');
            return response.data;
        } catch (error) {
            console.error('Saat dilimlerini getirirken hata oluştu:', error);
            throw error;
        }
    },
    
    // Yeni saat dilimi oluştur
    createHour: async (startTime, endTime) => {
        try {
            const response = await schedulesApi.post('/hours/', {
                start_time: startTime,
                end_time: endTime
            });
            return response.data;
        } catch (error) {
            console.error('Saat dilimi oluştururken hata oluştu:', error);
            throw error;
        }
    },
    
    // Saat dilimini sil
    deleteHour: async (hourId) => {
        try {
            await schedulesApi.delete(`/hours/${hourId}/`);
            return true;
        } catch (error) {
            console.error(`Saat dilimini silerken hata oluştu (ID: ${hourId}):`, error);
            throw error;
        }
    }
};

// Program-zaman ayarları API işlemleri
export const scheduleTimeApi = {
    // Belirli bir program için zaman ayarlarını getir
    getScheduleTimes: async (scheduleId) => {
        try {
            const response = await schedulesApi.get(`/schedule-times/by_schedule/?schedule_id=${scheduleId}`);
            return response.data;
        } catch (error) {
            console.error(`Program zaman ayarlarını getirirken hata oluştu (ID: ${scheduleId}):`, error);
            throw error;
        }
    },
    
    // Belirli bir gün için zaman ayarlarını getir
    getScheduleTimesByDay: async (dayId, scheduleId = null) => {
        try {
            let url = `/schedule-times/by_day/?day_id=${dayId}`;
            if (scheduleId) {
                url += `&schedule_id=${scheduleId}`;
            }
            
            const response = await schedulesApi.get(url);
            return response.data;
        } catch (error) {
            console.error(`Gün için zaman ayarlarını getirirken hata oluştu (Day ID: ${dayId}):`, error);
            throw error;
        }
    }
};

// Oda-program ilişkileri API işlemleri
export const roomScheduleApi = {
    // Tüm oda-program ilişkilerini getir
    getRoomSchedules: async () => {
        try {
            const response = await schedulesApi.get('/room-schedules/');
            return response.data;
        } catch (error) {
            console.error('Oda-program ilişkilerini getirirken hata oluştu:', error);
            throw error;
        }
    },
    
    // Belirli bir oda için program ilişkisini getir
    getRoomScheduleByRoom: async (roomId) => {
        try {
            const response = await schedulesApi.get(`/room-schedules/by_room/?room_id=${roomId}`);
            return response.data;
        } catch (error) {
            console.error(`Oda için program ilişkisini getirirken hata oluştu (ID: ${roomId}):`, error);
            throw error;
        }
    },
    
    // Yeni oda-program ilişkisi oluştur
    createRoomSchedule: async (roomId, scheduleId) => {
        try {
            const response = await schedulesApi.post('/room-schedules/', {
                room_id: roomId,
                schedule_id: scheduleId,
                is_active: true
            });
            return response.data;
        } catch (error) {
            console.error('Oda-program ilişkisi oluştururken hata oluştu:', error);
            throw error;
        }
    },
    
    // Oda-program ilişkisini güncelle
    updateRoomSchedule: async (roomScheduleId, data) => {
        try {
            const response = await schedulesApi.patch(`/room-schedules/${roomScheduleId}/`, data);
            return response.data;
        } catch (error) {
            console.error(`Oda-program ilişkisini güncellerken hata oluştu (ID: ${roomScheduleId}):`, error);
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
    roomApi,
    scheduleApi,
    dayApi,
    hourApi,
    scheduleTimeApi,
    roomScheduleApi
};