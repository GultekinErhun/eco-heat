**Django and React Secure Authentication**

Check out the youtube tutorial at https://www.youtube.com/watch?v=KVzGiRp_XU8

cd backend
venv\Scripts\activate

python manage.py makemigrations
python manage.py migrate
python manage.py runserver

cd frontend
npm install
npm start


net start mosquitto
sc query mosquitto

python manage.py mqtt_client status
python manage.py mqtt_client start

 python mqtt_simulator.py --broker localhost --port 1883 --interval 5 --rooms 


 http://localhost:8000/api/sensors/rooms/
 http://localhost:8000/api/sensors/rooms/6/room_details/


http://localhost:8000/api/sensors/rooms/1/control_valve/
{
  "valve_status": false
}
{
  "valve_status": true
}

http://localhost:8000/api/rooms/1/control_fan/
{
  "fan_status": true
}{
  "fan_status": false
}



 python manage.py create_default_schedules
 
 # Programları yönetmek için ViewSet
 http://localhost:8000/api/schedules/schedules/
 # Takvim Programının detaylı görüntüsünü günlere göre gruplanmış zaman dilimleriyle al
 http://localhost:8000/api/schedules/schedules/1/detailed/    
 # Günleri görüntülemek için
 http://localhost:8000/api/schedules/days/ 
 # Takvim Program ID'sine göre program-zaman ayarlarını getir
 http://localhost:8000/api/schedules/schedule-times/by_schedule/?schedule_id=1
 # Takvim Gün ID'sine göre program-zaman ayarlarını geti
 http://localhost:8000/api/schedules/schedule-times/by_day/?day_id=1

 # Program eklemek için post viewset
 http://localhost:8000/api/schedules/schedules/
 # Belirli bir programın zaman aralıklarını günceller
 http://localhost:8000/api/schedules/schedules/1/update_time_slots/,
 {
           "time_slots": [
             {
               "day_id": 1,
               "hour_id": 3,
               "temperature": 22.0,
               "is_heating_active": true,
               "is_fan_active": false
             },
             {
               "day_id": 1,
               "hour_id": 4,
               "temperature": 20.0,
               "is_heating_active": true,
               "is_fan_active": true
             }
           ]
}

# Belirli bir programı bir odaya atama
http://localhost:8000/api/schedules/schedules/1/assign_to_room/
{"room_id": 2}
# Belirli bir odanın programını görüntüleme
http://localhost:8000/api/schedules/room-schedules/by_room/?room_id=2
# Aktif olan tüm oda-program ilişkilerini listeleme
http://localhost:8000/api/schedules/room-schedules/active/
# Belirli bir programın ayarlarını güncelleme
http://localhost:8000/api/schedules/schedules/1/
{"name": "Updated Evening Comfort", "description": "Updated description"}
# Belirli bir zaman dilimi ayarını güncelleme
http://localhost:8000/api/schedules/schedule-times/5/
{"desired_temperature": 23.5, "is_fan_active": true}
# Belirli bir programı silme
DELETE http://localhost:8000/api/schedules/schedules/1/