import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const RoomsTab = () => {
  const [activeRoom, setActiveRoom] = useState('living-room');

  // Sample data for charts
  const temperatureData = [
    { time: '00', temp: 19 },
    { time: '06', temp: 20 },
    { time: '12', temp: 22 },
    { time: '18', temp: 23 },
    { time: '24', temp: 21 }
  ];

  const humidityData = [
    { time: '00', humidity: 65 },
    { time: '06', humidity: 70 },
    { time: '12', humidity: 75 },
    { time: '18', humidity: 80 },
    { time: '24', humidity: 72 }
  ];

  return (
    <div className="bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col md:flex-row">
        {/* Room Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-lg">
          <div className="p-4 flex md:block overflow-x-auto">
            <button
              onClick={() => setActiveRoom('living-room')}
              className={`p-3 text-left rounded-lg flex items-center mb-2 mr-2 md:mr-0 flex-shrink-0 ${
                activeRoom === 'living-room' 
                  ? 'bg-orange-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-orange-500 mr-3"></span>
              Living Room
            </button>
            <button
              onClick={() => setActiveRoom('hall')}
              className={`p-3 text-left rounded-lg flex items-center flex-shrink-0 ${
                activeRoom === 'hall' 
                  ? 'bg-orange-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-3"></span>
              Hall
            </button>
          </div>
        </div>

        {/* Room Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="border-l-4 border-green-500 pl-4 md:pl-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Living Room</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              {/* Temperature */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Temperature</h3>
                <div className="text-3xl font-bold">22°C</div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>

              {/* Humidity */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Humidity</h3>
                <div className="text-3xl font-bold">80%</div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>

              {/* Heating */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Heating</h3>
                <div className="flex flex-wrap space-x-2 mt-4">
                  <button className="px-3 py-1 mb-1 bg-gray-200 rounded">Off</button>
                  <button className="px-3 py-1 mb-1 bg-gray-200 rounded">Schedule</button>
                  <button className="px-3 py-1 mb-1 bg-green-500 text-white rounded">On</button>
                </div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              {/* Activity and Presence */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Activity</h3>
                  <div className="text-xl">Heating</div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Presence</h3>
                  <div className="text-xl">Empty</div>
                  <div className="h-1 bg-green-500 rounded mt-2"></div>
                </div>
              </div>

              {/* Fans */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Fans</h3>
                <div className="flex flex-wrap space-x-2 mt-4">
                  <button className="px-3 py-1 mb-1 bg-gray-200 rounded">Off</button>
                  <button className="px-3 py-1 mb-1 bg-green-500 text-white rounded">Schedule</button>
                  <button className="px-3 py-1 mb-1 bg-gray-200 rounded">On</button>
                </div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Temperature</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={temperatureData}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Line type="monotone" dataKey="temp" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Humidity</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={humidityData}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Line type="monotone" dataKey="humidity" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Selected Schedule</h3>
                <div className="text-lg">Work Schedule</div>
                <button className="text-blue-500 text-sm mt-2">Click to Edit</button>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Battery</h3>
                <div className="text-3xl font-bold">90%</div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Connection</h3>
                <div className="text-lg">Stable</div>
                <div className="h-1 bg-green-500 rounded mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsTab;