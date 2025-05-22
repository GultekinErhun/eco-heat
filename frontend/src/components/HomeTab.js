import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle } from 'lucide-react';

const HomeTab = () => {
  // Sample data for charts
  const temperatureData = [
    { time: '00', temp: 19 },
    { time: '06', temp: 20 },
    { time: '12', temp: 22 },
    { time: '18', temp: 23 },
    { time: '24', temp: 21 }
  ];

  return (
    <div className="p-4 bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium">22 May 2024<br />Thursday</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left Column - Status Cards */}
        <div className="space-y-4">


          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Outside Temp</h3>
            <div className="text-3xl font-bold">12°C</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Humidity</h3>
            <div className="text-3xl font-bold">76%</div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Active Rooms</h3>
            <div className="text-3xl font-bold">3/5-</div>
          </div>
        </div>

        {/* Middle Column - Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Force Enable All</span>
                <button className="bg-gray-300 rounded-full w-12 h-6 relative">
                  <div className="bg-white w-5 h-5 rounded-full absolute left-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Force Disable All</span>
                <button className="bg-gray-300 rounded-full w-12 h-6 relative">
                  <div className="bg-white w-5 h-5 rounded-full absolute left-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - System Diagnostic */}
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">System Diagnostic</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Sensors</span>
                <CheckCircle className="text-green-500 w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <span>Valves</span>
                <CheckCircle className="text-green-500 w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <span>Fans</span>
                <span className="bg-black text-white px-2 py-1 rounded text-sm">1!</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Notifications</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              No Notifications
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mt-4 bg-white p-3 rounded-lg shadow">
        <div className="flex justify-center mb-4">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={temperatureData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Line type="monotone" dataKey="temp" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex justify-around text-sm text-gray-600">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
        <div className="text-center mt-2 text-sm text-gray-500">This week</div>
      </div>
    </div>
  );
};

export default HomeTab;