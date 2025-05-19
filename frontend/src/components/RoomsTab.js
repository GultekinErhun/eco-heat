import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import api from '../api/endpoints';

const RoomsTab = () => {
  // State tanımları
  const [rooms, setRooms] = useState([]);  // Başlangıçta boş dizi
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Odaları getir
  useEffect(() => {
    console.log("Odaları getirme useEffect çalıştı");
    
    const fetchRooms = async () => {
      console.log("fetchRooms fonksiyonu çalıştı");
      try {
        console.log("api.roomApi.getRooms() çağrılıyor...");
        const data = await api.roomApi.getRooms();
        console.log("Alınan oda verileri:", data);
        
        // Gelen veri bir dizi olarak kontrol et ve işle
        if (data && Array.isArray(data)) {
          setRooms(data);
          
          // İlk odayı seç (opsiyonel)
          if (data.length > 0) {
            setActiveRoom(data[0].id);
          }
        } else if (data && !Array.isArray(data)) {
          // Eğer data bir object ise ve içinde rooms veya results gibi bir dizi varsa
          if (data.rooms && Array.isArray(data.rooms)) {
            setRooms(data.rooms);
            if (data.rooms.length > 0) {
              setActiveRoom(data.rooms[0].id);
            }
          } else if (data.results && Array.isArray(data.results)) {
            setRooms(data.results);
            if (data.results.length > 0) {
              setActiveRoom(data.results[0].id);
            }
          } else {
            // Belirli bir yapıda dizi bulunamadı
            console.error('Beklenmeyen veri formatı:', data);
            setError('Oda verileri beklenmeyen formatta.');
            // Veriyi console'a yazdırıp analiz edelim
            console.log("Gelen veri:", JSON.stringify(data, null, 2));
            setRooms([]);
          }
        } else {
          // Veri yok veya undefined
          setRooms([]);
          setError('Oda verisi bulunamadı.');
        }
      } catch (error) {
        console.error('Odaları yüklerken hata:', error);
        setError('Odalar yüklenemedi.');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Aktif oda değiştiğinde oda detaylarını getir
  useEffect(() => {
    if (!activeRoom) return;

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const response = await api.roomApi.getRoomDetails(activeRoom);
        console.log("Oda detayları:", response);
        setRoomData(response);
        setLoading(false);
      } catch (err) {
        console.error('Oda detaylarını getirirken hata oluştu:', err);
        setError('Oda detayları yüklenemedi.');
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [activeRoom]);

  // Isıtma kontrolü
  const handleHeatingControl = async (status) => {
    try {
      await api.roomApi.controlValve(activeRoom, status);
      // Oda verilerini güncelle
      const response = await api.roomApi.getRoomDetails(activeRoom);
      setRoomData(response);
    } catch (err) {
      console.error('Isıtma kontrolünde hata:', err);
    }
  };

  // Fan kontrolü
  const handleFanControl = async (status) => {
    try {
      await api.roomApi.controlFan(activeRoom, status);
      // Oda verilerini güncelle
      const response = await api.roomApi.getRoomDetails(activeRoom);
      setRoomData(response);
    } catch (err) {
      console.error('Fan kontrolünde hata:', err);
    }
  };

  // Yükleniyor durumu
  if (loading && !roomData) {
    return <div>Yükleniyor...</div>;
  }

  // Hata durumu
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col md:flex-row">
        {/* Odalar Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-lg">
          <div className="p-4 flex md:block overflow-x-auto">
            {/* Rooms.map güvenli bir şekilde kullanılıyor */}
            {Array.isArray(rooms) && rooms.length > 0 ? (
              rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`p-3 text-left rounded-lg flex items-center mb-2 mr-2 md:mr-0 flex-shrink-0 ${
                    activeRoom === room.id 
                      ? 'bg-orange-500 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-orange-500 mr-3"></span>
                  {room.name}
                </button>
              ))
            ) : (
              <div className="text-center p-4">Henüz oda eklenmemiş</div>
            )}
          </div>
        </div>

        {/* Oda İçeriği */}
        {roomData && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="border-l-4 border-green-500 pl-4 md:pl-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                {roomData.room && roomData.room.name ? roomData.room.name : 'Oda'}
              </h2>

              {/* Sensör Değerleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                {/* Sıcaklık */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Temperature</h3>
                  <div className="text-3xl font-bold">
                    {roomData.current_sensor_data && roomData.current_sensor_data.temperature !== undefined 
                      ? `${roomData.current_sensor_data.temperature}°C` 
                      : 'N/A'}
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>

                {/* Nem */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Humidity</h3>
                  <div className="text-3xl font-bold">
                    {roomData.current_sensor_data && roomData.current_sensor_data.humidity !== undefined 
                      ? `${roomData.current_sensor_data.humidity}%` 
                      : 'N/A'}
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>

                {/* Isıtma */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Heating</h3>
                  <div className="flex flex-wrap space-x-2 mt-4">
                    <button 
                      className={`px-3 py-1 mb-1 ${!(roomData.device_status && roomData.device_status.valve_status) ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded`}
                      onClick={() => handleHeatingControl(false)}
                    >
                      Off
                    </button>
                    <button className="px-3 py-1 mb-1 bg-gray-200 rounded">Schedule</button>
                    <button 
                      className={`px-3 py-1 mb-1 ${roomData.device_status && roomData.device_status.valve_status ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded`}
                      onClick={() => handleHeatingControl(true)}
                    >
                      On
                    </button>
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>
              </div>

              {/* Aktivite, Varlık ve Fan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-2">Activity</h3>
                    <div className="text-xl">
                      {roomData.device_status && roomData.device_status.valve_status 
                        ? "Heating" 
                        : roomData.device_status && roomData.device_status.fan_status 
                          ? "Ventilating" 
                          : "Idle"}
                    </div>
                    <div className="h-1 bg-green-500 rounded mt-2"></div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-2">Presence</h3>
                    <div className="text-xl">
                      {roomData.current_sensor_data && roomData.current_sensor_data.presence
                        ? "Occupied" 
                        : "Empty"}
                    </div>
                    <div className="h-1 bg-green-500 rounded mt-2"></div>
                  </div>
                </div>

                {/* Fan Kontrolü */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Fans</h3>
                  <div className="flex flex-wrap space-x-2 mt-4">
                    <button 
                      className={`px-3 py-1 mb-1 ${!(roomData.device_status && roomData.device_status.fan_status) ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded`}
                      onClick={() => handleFanControl(false)}
                    >
                      Off
                    </button>
                    <button className="px-3 py-1 mb-1 bg-gray-200 rounded">Schedule</button>
                    <button 
                      className={`px-3 py-1 mb-1 ${roomData.device_status && roomData.device_status.fan_status ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded`}
                      onClick={() => handleFanControl(true)}
                    >
                      On
                    </button>
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>
              </div>

              {/* Diğer Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Last Update</h3>
                  <div className="text-lg">
                    {roomData.current_sensor_data && roomData.current_sensor_data.timestamp
                      ? new Date(roomData.current_sensor_data.timestamp).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Battery</h3>
                  <div className="text-3xl font-bold">
                    {roomData.device_status && roomData.device_status.battery_level !== undefined
                      ? `${roomData.device_status.battery_level}%`
                      : 'N/A'}
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Connection</h3>
                  <div className="text-lg">
                    {roomData.device_status && roomData.device_status.connection_status
                      ? roomData.device_status.connection_status
                      : 'N/A'}
                  </div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsTab;