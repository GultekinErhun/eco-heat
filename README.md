**Django and React Secure Authentication**

Check out the youtube tutorial at https://www.youtube.com/watch?v=KVzGiRp_XU8

cd backend
venv\Scripts\activate
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