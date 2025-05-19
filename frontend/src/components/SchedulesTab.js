import React, { useState } from 'react';

const SchedulesTab = () => {
  const [activeSchedule, setActiveSchedule] = useState('work-schedule');

  return (
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
};

export default SchedulesTab;