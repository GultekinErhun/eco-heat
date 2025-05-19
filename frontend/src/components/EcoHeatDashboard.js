import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const EcoHeatDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeRoom, setActiveRoom] = useState('living-room');
  const [activeSchedule, setActiveSchedule] = useState('work-schedule');

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

  const Header = () => (
    <div className="bg-green-500 text-white">
      <nav className="flex">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-3 text-base font-medium ${
            activeTab === 'home' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-3 text-base font-medium ${
            activeTab === 'rooms' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-3 text-base font-medium ${
            activeTab === 'schedules' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Schedules
        </button>
      </nav>
    </div>
  );

  const HomeTab = () => (
    <div className="p-4 bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium">24 March 2024<br />Monday</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left Column - Status Cards */}
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Room Temp</h3>
            <div className="text-3xl font-bold">23°C</div>
          </div>

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
            <div className="text-3xl font-bold">1/2</div>
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
              Living Room Fan has connection problems
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

  const RoomsTab = () => (
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

  const SchedulesTab = () => (
    <div className="bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col md:flex-row">
        {/* Schedule Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-lg">
          <div className="p-4 flex md:block overflow-x-auto">
            <button
              onClick={() => setActiveSchedule('default-schedule')}
              className={`p-3 text-left rounded-lg mb-2 mr-2 md:mr-0 flex-shrink-0 ${
                activeSchedule === 'default-schedule' 
                  ? 'bg-green-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Default Schedule
            </button>
            <button
              onClick={() => setActiveSchedule('work-schedule')}
              className={`p-3 text-left rounded-lg mb-2 mr-2 md:mr-0 flex-shrink-0 ${
                activeSchedule === 'work-schedule' 
                  ? 'bg-green-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Work Schedule
            </button>
            <button
              onClick={() => setActiveSchedule('holiday-schedule')}
              className={`p-3 text-left rounded-lg mr-2 md:mr-0 flex-shrink-0 ${
                activeSchedule === 'holiday-schedule' 
                  ? 'bg-green-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Holiday Schedule
            </button>
          </div>
        </div>

        {/* Schedule Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="border-l-4 border-green-500 pl-4 md:pl-6">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <button className="px-4 py-2 bg-green-500 text-white rounded">All Week</button>
                <button className="px-4 py-2 bg-gray-200 rounded">Week Day</button>
                <button className="px-4 py-2 bg-gray-200 rounded">Week-End</button>
                <button className="px-4 py-2 bg-gray-200 rounded">Separate Days</button>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 bg-gray-200 rounded">Mon</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Tue</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Wed</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Thu</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Fri</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Sat</span>
                <span className="px-3 py-1 bg-gray-200 rounded">Sun</span>
              </div>
            </div>

            {/* Desired Temp */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-2">Desired Temp</h3>
              <div className="text-3xl font-bold">24°C</div>
            </div>

            {/* Heating Schedule */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="text-lg font-medium mb-4">Heating</h3>
              <div className="flex items-center space-x-1 mb-2 overflow-x-auto pb-2">
                {/* Schedule bars */}
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-4 rounded ${
                      i < 3 || (i >= 6 && i < 9) || (i >= 18 && i < 21)
                        ? 'bg-orange-500'
                        : i >= 15 && i < 18
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs md:text-sm text-gray-600 overflow-hidden">
                <span>3 AM</span>
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>9 PM</span>
              </div>
              <div className="flex flex-wrap items-center mt-4 gap-2">
                <button className="px-4 py-2 bg-orange-500 text-white rounded">On</button>
                <span className="text-sm">Presence</span>
                <button className="px-4 py-2 bg-gray-200 rounded">Off</button>
              </div>
            </div>

            {/* Fan Control */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Fan Control</h3>
              <div className="flex items-center space-x-1 mb-2 overflow-x-auto pb-2">
                {/* Schedule bars */}
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-4 rounded ${
                      i < 3 || (i >= 6 && i < 9) || (i >= 18 && i < 21)
                        ? 'bg-orange-500'
                        : i >= 15 && i < 18
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs md:text-sm text-gray-600 overflow-hidden">
                <span>3 AM</span>
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>9 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'rooms' && <RoomsTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
      </div>
    </div>
  );
};

export default EcoHeatDashboard;