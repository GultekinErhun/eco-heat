import React, { useState, useEffect } from 'react';
import { 
  fetchSchedules, 
  fetchScheduleDetails, 
  fetchDays, 
  fetchHours, 
  createSchedule, 
  updateScheduleTimeSlots,
  createHour,
  deleteSchedule
} from '../api/endpoints';

const SchedulesTab = () => {
  // State for schedules and active schedule
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [activeScheduleDetails, setActiveScheduleDetails] = useState(null);
  
  // State for days and hours
  const [days, setDays] = useState([]);
  const [hours, setHours] = useState([]);
  
  // State for new schedule form
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleDescription, setNewScheduleDescription] = useState('');
  
  // State for time slot editing
  const [selectedDayType, setSelectedDayType] = useState('all-week');
  const [selectedDays, setSelectedDays] = useState([]);
  const [desiredTemperature, setDesiredTemperature] = useState(24);
  const [isHeatingActive, setIsHeatingActive] = useState(true);
  const [isFanActive, setIsFanActive] = useState(false);
  
  // State for time slot creation
  const [isCreatingTimeSlot, setIsCreatingTimeSlot] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  
  // State for editing mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [timeSlotSelections, setTimeSlotSelections] = useState({});

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [schedulesData, daysData, hoursData] = await Promise.all([
          fetchSchedules(),
          fetchDays(),
          fetchHours()
        ]);
        
        setSchedules(schedulesData);
        setDays(daysData);
        setHours(hoursData);
        
        // Set first schedule as active if available
        if (schedulesData.length > 0) {
          setActiveSchedule(schedulesData[0].id);
          loadScheduleDetails(schedulesData[0].id);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Load schedule details when active schedule changes
  const loadScheduleDetails = async (scheduleId) => {
    try {
      const details = await fetchScheduleDetails(scheduleId);
      setActiveScheduleDetails(details);
      
      // Initialize time slot selections based on schedule details
      const selections = {};
      if (details && details.schedule_times) {
        details.schedule_times.forEach(timeSlot => {
          const key = `${timeSlot.day_id.id}_${timeSlot.hour_id.id}`;
          selections[key] = {
            isSelected: true,
            temperature: timeSlot.desired_temperature,
            isHeatingActive: timeSlot.is_heating_active,
            isFanActive: timeSlot.is_fan_active
          };
        });
      }
      setTimeSlotSelections(selections);
    } catch (error) {
      console.error('Error loading schedule details:', error);
    }
  };
  
  useEffect(() => {
    if (activeSchedule) {
      loadScheduleDetails(activeSchedule);
    }
  }, [activeSchedule]);
  
  // Handle day type selection
  const handleDayTypeSelect = (type) => {
    setSelectedDayType(type);
    
    // Set selected days based on day type
    if (type === 'all-week') {
      setSelectedDays(days.map(day => day.id));
    } else if (type === 'weekday') {
      const weekdayIds = days
        .filter(day => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day.day))
        .map(day => day.id);
      setSelectedDays(weekdayIds);
    } else if (type === 'weekend') {
      const weekendIds = days
        .filter(day => ['Saturday', 'Sunday'].includes(day.day))
        .map(day => day.id);
      setSelectedDays(weekendIds);
    } else {
      setSelectedDays([]);
    }
  };
  
  // Toggle day selection
  const toggleDaySelection = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };
  
  // Handle creating a new schedule
  const handleCreateSchedule = async () => {
    try {
      const newSchedule = await createSchedule(newScheduleName, newScheduleDescription);
      setSchedules([...schedules, newSchedule]);
      setActiveSchedule(newSchedule.id);
      setIsCreatingSchedule(false);
      setNewScheduleName('');
      setNewScheduleDescription('');
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };
  
  // Handle creating a new time slot
  const handleCreateTimeSlot = async () => {
    try {
      const newHour = await createHour(newStartTime, newEndTime);
      setHours([...hours, newHour]);
      setIsCreatingTimeSlot(false);
      setNewStartTime('');
      setNewEndTime('');
    } catch (error) {
      console.error('Error creating time slot:', error);
    }
  };
  
  // Toggle time slot selection in edit mode
  const toggleTimeSlot = (dayId, hourId) => {
    const key = `${dayId}_${hourId}`;
    setTimeSlotSelections(prev => {
      const newSelections = { ...prev };
      
      if (newSelections[key]) {
        // If already exists, toggle selection
        newSelections[key] = {
          ...newSelections[key],
          isSelected: !newSelections[key].isSelected
        };
      } else {
        // If doesn't exist, create new with default values
        newSelections[key] = {
          isSelected: true,
          temperature: desiredTemperature,
          isHeatingActive,
          isFanActive
        };
      }
      
      return newSelections;
    });
  };
  
  // Save schedule time slots
  const saveScheduleTimeSlots = async () => {
    if (!activeSchedule) return;
    
    try {
      const timeSlots = Object.entries(timeSlotSelections)
        .filter(([_, value]) => value.isSelected)
        .map(([key, value]) => {
          const [dayId, hourId] = key.split('_');
          return {
            day_id: parseInt(dayId),
            hour_id: parseInt(hourId),
            temperature: value.temperature,
            is_heating_active: value.isHeatingActive,
            is_fan_active: value.isFanActive
          };
        });
      
      await updateScheduleTimeSlots(activeSchedule, timeSlots);
      loadScheduleDetails(activeSchedule);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving schedule time slots:', error);
    }
  };
  
  // Handle deleting a schedule
  const handleDeleteSchedule = async () => {
    if (!activeSchedule) return;
    
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(activeSchedule);
        const updatedSchedules = schedules.filter(s => s.id !== activeSchedule);
        setSchedules(updatedSchedules);
        
        if (updatedSchedules.length > 0) {
          setActiveSchedule(updatedSchedules[0].id);
        } else {
          setActiveSchedule(null);
          setActiveScheduleDetails(null);
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  // Group hours by time period for display
  const getTimePeriodsForDisplay = () => {
    // Sort hours by start time
    const sortedHours = [...hours].sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });
    
    // Group into morning, afternoon, evening, night
    const periods = {
      morning: sortedHours.filter(h => h.start_time >= '06:00' && h.start_time < '12:00'),
      afternoon: sortedHours.filter(h => h.start_time >= '12:00' && h.start_time < '18:00'),
      evening: sortedHours.filter(h => h.start_time >= '18:00' && h.start_time < '22:00'),
      night: sortedHours.filter(h => h.start_time >= '22:00' || h.start_time < '06:00')
    };
    
    return periods;
  };

  return (
    <div className="bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col md:flex-row">
        {/* Schedule Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Schedules</h3>
              <button 
                onClick={() => setIsCreatingSchedule(true)}
                className="p-2 bg-green-500 text-white rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* New Schedule Form */}
            {isCreatingSchedule && (
              <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">New Schedule</h4>
                <input
                  type="text"
                  placeholder="Schedule Name"
                  className="w-full p-2 mb-2 border rounded"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                />
                <textarea
                  placeholder="Description (optional)"
                  className="w-full p-2 mb-2 border rounded"
                  value={newScheduleDescription}
                  onChange={(e) => setNewScheduleDescription(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => setIsCreatingSchedule(false)}
                    className="px-3 py-1 text-sm border rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateSchedule}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded"
                    disabled={!newScheduleName}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
            
            {/* Schedule List */}
            <div className="md:block overflow-x-auto">
              {schedules.map(schedule => (
                <button
                  key={schedule.id}
                  onClick={() => setActiveSchedule(schedule.id)}
                  className={`p-3 text-left rounded-lg mb-2 w-full ${
                    activeSchedule === schedule.id 
                    ? 'bg-green-500 text-white' 
                    : 'hover:bg-gray-100'
                  }`}
                >
                  {schedule.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Content */}
        {activeScheduleDetails ? (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{activeScheduleDetails.name}</h2>
              <div className="flex space-x-2">
                {isEditMode ? (
                  <>
                    <button 
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveScheduleTimeSlots}
                      className="px-4 py-2 bg-green-500 text-white rounded"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      Edit Schedule
                    </button>
                    <button 
                      onClick={handleDeleteSchedule}
                      className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {activeScheduleDetails.description && (
              <p className="text-gray-600 mb-6">{activeScheduleDetails.description}</p>
            )}
            
            {isEditMode && (
              <div className="border-l-4 border-green-500 pl-4 md:pl-6 mb-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Select Days</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      onClick={() => handleDayTypeSelect('all-week')}
                      className={`px-4 py-2 rounded ${selectedDayType === 'all-week' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      All Week
                    </button>
                    <button 
                      onClick={() => handleDayTypeSelect('weekday')}
                      className={`px-4 py-2 rounded ${selectedDayType === 'weekday' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      Week Day
                    </button>
                    <button 
                      onClick={() => handleDayTypeSelect('weekend')}
                      className={`px-4 py-2 rounded ${selectedDayType === 'weekend' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      Week-End
                    </button>
                    <button 
                      onClick={() => handleDayTypeSelect('custom')}
                      className={`px-4 py-2 rounded ${selectedDayType === 'custom' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      Separate Days
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm mb-4">
                    {days.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDaySelection(day.id)}
                        className={`px-3 py-1 rounded ${
                          selectedDays.includes(day.id) ? 'bg-green-500 text-white' : 'bg-gray-200'
                        }`}
                      >
                        {day.day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desired Temperature */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium mb-2">Desired Temperature</h3>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={desiredTemperature}
                      onChange={(e) => setDesiredTemperature(parseFloat(e.target.value))}
                      className="w-full mr-4"
                    />
                    <div className="text-3xl font-bold">{desiredTemperature}°C</div>
                  </div>
                </div>

                {/* Device Controls */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium mb-4">Device Controls</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="mr-2">Heating:</span>
                      <button 
                        onClick={() => setIsHeatingActive(true)}
                        className={`px-4 py-2 rounded ${isHeatingActive ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                      >
                        On
                      </button>
                      <button 
                        onClick={() => setIsHeatingActive(false)}
                        className={`px-4 py-2 rounded ${!isHeatingActive ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                      >
                        Off
                      </button>
                    </div>
                    <div>
                      <span className="mr-2">Fan:</span>
                      <button 
                        onClick={() => setIsFanActive(true)}
                        className={`px-4 py-2 rounded ${isFanActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        On
                      </button>
                      <button 
                        onClick={() => setIsFanActive(false)}
                        className={`px-4 py-2 rounded ${!isFanActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Time Slots</h3>
                    <button 
                      onClick={() => setIsCreatingTimeSlot(true)}
                      className="p-2 bg-green-500 text-white rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* New Time Slot Form */}
                  {isCreatingTimeSlot && (
                    <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2">New Time Slot</h4>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="time"
                          placeholder="Start Time"
                          className="flex-1 p-2 border rounded"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                        />
                        <input
                          type="time"
                          placeholder="End Time"
                          className="flex-1 p-2 border rounded"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setIsCreatingTimeSlot(false)}
                          className="px-3 py-1 text-sm border rounded"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreateTimeSlot}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded"
                          disabled={!newStartTime || !newEndTime}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Time Slots Selection */}
                  <div className="space-y-4">
                    {Object.entries(getTimePeriodsForDisplay()).map(([period, periodHours]) => (
                      <div key={period} className="mb-4">
                        <h4 className="font-medium mb-2 capitalize">{period}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {periodHours.map(hour => (
                            <button
                              key={hour.id}
                              onClick={() => {
                                if (selectedDays.length > 0) {
                                  selectedDays.forEach(dayId => {
                                    toggleTimeSlot(dayId, hour.id);
                                  });
                                }
                              }}
                              className={`p-2 border rounded text-sm ${
                                selectedDays.some(dayId => 
                                  timeSlotSelections[`${dayId}_${hour.id}`]?.isSelected
                                )
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100'
                              }`}
                            >
                              {hour.start_time.substring(0, 5)} - {hour.end_time.substring(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Schedule Display (View Mode) */}
            {!isEditMode && (
              <div>
                {/* Days Overview */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium mb-2">Active Days</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {days.map(day => {
                      const isActive = activeScheduleDetails.schedule_times?.some(
                        time => time.day_id.id === day.id
                      );
                      return (
                        <span 
                          key={day.id}
                          className={`px-3 py-1 rounded ${
                            isActive ? 'bg-green-500 text-white' : 'bg-gray-200'
                          }`}
                        >
                          {day.day}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* Temperature Overview */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium mb-2">Temperature Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {days.filter(day => 
                      activeScheduleDetails.schedule_times?.some(time => time.day_id.id === day.id)
                    ).map(day => (
                      <div key={day.id} className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">{day.day}</h4>
                        <div className="space-y-2">
                          {hours.filter(hour => 
                            activeScheduleDetails.schedule_times?.some(
                              time => time.day_id.id === day.id && time.hour_id.id === hour.id
                            )
                          ).map(hour => {
                            const timeSlot = activeScheduleDetails.schedule_times.find(
                              time => time.day_id.id === day.id && time.hour_id.id === hour.id
                            );
                            return (
                              <div key={hour.id} className="flex justify-between items-center text-sm">
                                <span>{hour.start_time.substring(0, 5)} - {hour.end_time.substring(0, 5)}</span>
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">{timeSlot.desired_temperature}°C</span>
                                  {timeSlot.is_heating_active && (
                                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-1" title="Heating On"></span>
                                  )}
                                  {timeSlot.is_fan_active && (
                                    <span className="w-3 h-3 rounded-full bg-blue-500" title="Fan On"></span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Visual Schedule */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Daily Schedule Overview</h3>
                  {days.filter(day => 
                    activeScheduleDetails.schedule_times?.some(time => time.day_id.id === day.id)
                  ).map(day => (
                    <div key={day.id} className="mb-6">
                      <h4 className="font-medium mb-2">{day.day}</h4>
                      <div className="flex items-center space-x-1 mb-2 overflow-x-auto pb-2">
                        {/* Schedule bars */}
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0') + ':00';
                          const activeHour = hours.find(h => 
                            h.start_time.startsWith(hour) && 
                            activeScheduleDetails.schedule_times?.some(
                              time => time.day_id.id === day.id && time.hour_id.id === h.id
                            )
                          );
                          
                          let bgColor = 'bg-gray-200';
                          if (activeHour) {
                            const timeSlot = activeScheduleDetails.schedule_times.find(
                              time => time.day_id.id === day.id && time.hour_id.id === activeHour.id
                            );
                            
                            if (timeSlot.is_heating_active && timeSlot.is_fan_active) {
                              bgColor = 'bg-purple-500'; // Both active
                            } else if (timeSlot.is_heating_active) {
                              bgColor = 'bg-orange-500'; // Heating active
                            } else if (timeSlot.is_fan_active) {
                              bgColor = 'bg-blue-500'; // Fan active
                            } else {
                              bgColor = 'bg-green-500'; // Schedule active but devices off
                            }
                          }
                          
                          return (
                            <div
                              key={i}
                              className={`h-8 w-4 rounded ${bgColor}`}
                              title={`${i}:00 - ${i+1}:00`}
                            ></div>
                          );
                        })}
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
                  ))}
                  
                  {/* Legend */}
                  <div className="flex flex-wrap items-center mt-4 gap-3">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
                      <span className="text-sm">Heating</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      <span className="text-sm">Fan</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
                      <span className="text-sm">Both</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                      <span className="text-sm">Schedule Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 flex items-center justify-center">
            <p className="text-gray-500">
              {schedules.length > 0 
                ? 'Select a schedule to view details' 
                : 'Create a schedule to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulesTab;