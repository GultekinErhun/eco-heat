import React, { useState, useEffect } from 'react';
import api from '../api/endpoints';

const SchedulesTab = () => {
  // State definitions
  const [schedules, setSchedules] = useState([]);
  const [days, setDays] = useState([]);
  const [hours, setHours] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [scheduleDetails, setScheduleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleDescription, setNewScheduleDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch schedules
        const schedulesData = await api.scheduleApi.getSchedules();
        setSchedules(schedulesData.results || schedulesData);
        
        // Fetch days
        const daysData = await api.dayApi.getDays();
        setDays(daysData.results || daysData);
        
        // Fetch hours
        const hoursData = await api.hourApi.getHours();
        setHours(hoursData.results || hoursData);
        
        // Fetch rooms
        const roomsData = await api.roomApi.getRooms();
        // Ensure rooms is an array
        const roomsArray = Array.isArray(roomsData) ? roomsData : 
                          (roomsData.results ? roomsData.results : 
                          (roomsData.rooms ? roomsData.rooms : []));
        setRooms(roomsArray);
        
        // Set first schedule as active if available
        if (schedulesData.results?.length > 0 || schedulesData?.length > 0) {
          const firstSchedule = schedulesData.results?.[0] || schedulesData[0];
          setActiveSchedule(firstSchedule.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch schedule details when active schedule changes
  useEffect(() => {
    if (!activeSchedule) return;

    const fetchScheduleDetails = async () => {
      try {
        setLoading(true);
        const details = await api.scheduleApi.getScheduleDetails(activeSchedule);
        setScheduleDetails(details);
        
        // Fetch time slots for this schedule
        const timeSlotsData = await api.scheduleTimeApi.getScheduleTimes(activeSchedule);
        setTimeSlots(timeSlotsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedule details:', error);
        setError('Failed to load schedule details.');
        setLoading(false);
      }
    };

    fetchScheduleDetails();
  }, [activeSchedule]);

  // Create new schedule
  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) {
      setError('Schedule name is required');
      return;
    }

    try {
      setLoading(true);
      const newSchedule = await api.scheduleApi.createSchedule(
        newScheduleName,
        newScheduleDescription
      );
      
      // Add new schedule to the list
      setSchedules([...schedules, newSchedule]);
      
      // Set as active schedule
      setActiveSchedule(newSchedule.id);
      
      // Reset form
      setNewScheduleName('');
      setNewScheduleDescription('');
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('Failed to create schedule.');
      setLoading(false);
    }
  };

  // Update time slot
  const handleTimeSlotChange = (dayId, hourId, field, value) => {
    // Create a copy of the time slots
    const updatedTimeSlots = [...timeSlots];
    
    // Find the time slot with the given day and hour
    const slotIndex = updatedTimeSlots.findIndex(
      slot => slot.day_id === dayId && slot.hour_id === hourId
    );
    
    if (slotIndex !== -1) {
      // Update existing time slot
      updatedTimeSlots[slotIndex] = {
        ...updatedTimeSlots[slotIndex],
        [field]: value
      };
    } else {
      // Create new time slot
      updatedTimeSlots.push({
        day_id: dayId,
        hour_id: hourId,
        schedule_id: activeSchedule,
        desired_temperature: field === 'desired_temperature' ? value : 24.0,
        is_heating_active: field === 'is_heating_active' ? value : true,
        is_fan_active: field === 'is_fan_active' ? value : false
      });
    }
    
    setTimeSlots(updatedTimeSlots);
  };

  // Save time slots
  const handleSaveTimeSlots = async () => {
    try {
      setLoading(true);
      
      // Format time slots for API
      const formattedTimeSlots = timeSlots.map(slot => ({
        day_id: slot.day_id,
        hour_id: slot.hour_id,
        temperature: slot.desired_temperature,
        is_heating_active: slot.is_heating_active,
        is_fan_active: slot.is_fan_active
      }));
      
      await api.scheduleApi.updateTimeSlots(activeSchedule, formattedTimeSlots);
      
      // Refresh schedule details
      const details = await api.scheduleApi.getScheduleDetails(activeSchedule);
      setScheduleDetails(details);
      
      setEditMode(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving time slots:', error);
      setError('Failed to save time slots.');
      setLoading(false);
    }
  };

  // Assign schedule to room
  const handleAssignToRoom = async () => {
    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }

    try {
      setLoading(true);
      await api.scheduleApi.assignScheduleToRoom(activeSchedule, selectedRoom);
      setLoading(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error assigning schedule to room:', error);
      setError('Failed to assign schedule to room.');
      setLoading(false);
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async () => {
    if (!activeSchedule) return;

    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      setLoading(true);
      await api.scheduleApi.deleteSchedule(activeSchedule);
      
      // Remove from list
      const updatedSchedules = schedules.filter(s => s.id !== activeSchedule);
      setSchedules(updatedSchedules);
      
      // Set new active schedule if available
      if (updatedSchedules.length > 0) {
        setActiveSchedule(updatedSchedules[0].id);
      } else {
        setActiveSchedule(null);
        setScheduleDetails(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('Failed to delete schedule.');
      setLoading(false);
    }
  };

  // Get time slot for a specific day and hour
  const getTimeSlot = (dayId, hourId) => {
    return timeSlots.find(slot => 
      slot.day_id === dayId && slot.hour_id === hourId
    );
  };

  // Loading state
  if (loading && !scheduleDetails) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col md:flex-row">
        {/* Schedules Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Schedules</h3>
            
            {/* Schedule List */}
            <div className="mb-6 max-h-96 overflow-y-auto">
              {schedules.length > 0 ? (
                schedules.map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => setActiveSchedule(schedule.id)}
                    className={`p-3 text-left rounded-lg flex items-center mb-2 w-full ${
                      activeSchedule === schedule.id 
                        ? 'bg-orange-500 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-3"></span>
                    {schedule.name}
                  </button>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">No schedules yet</div>
              )}
            </div>
            
            {/* Create New Schedule Form */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium mb-2">Create New Schedule</h4>
              <input
                type="text"
                placeholder="Schedule Name"
                className="w-full p-2 border rounded mb-2"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
              />
              <textarea
                placeholder="Description (optional)"
                className="w-full p-2 border rounded mb-2"
                value={newScheduleDescription}
                onChange={(e) => setNewScheduleDescription(e.target.value)}
              />
              <button
                onClick={handleCreateSchedule}
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Content */}
        {activeSchedule && scheduleDetails ? (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="border-l-4 border-orange-500 pl-4 md:pl-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold">
                  {scheduleDetails.name}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editMode ? 'Cancel' : 'Edit Schedule'}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleSaveTimeSlots}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save Changes
                    </button>
                  )}
                  <button
                    onClick={handleDeleteSchedule}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {scheduleDetails.description && (
                <p className="text-gray-600 mb-6">{scheduleDetails.description}</p>
              )}

              {/* Assign to Room */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-2">Assign to Room</h3>
                <div className="flex space-x-2">
                  <select
                    className="flex-1 p-2 border rounded"
                    value={selectedRoom || ''}
                    onChange={(e) => setSelectedRoom(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select a room</option>
                    {Array.isArray(rooms) ? (
                      rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))
                    ) : (
                      <option value="">No rooms available</option>
                    )}
                  </select>
                  <button
                    onClick={handleAssignToRoom}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Day Selector */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">Select Day</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(days) && days.map(day => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
                      className={`px-4 py-2 rounded ${
                        selectedDay === day.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Table */}
              {selectedDay && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">
                    Schedule for {Array.isArray(days) && days.find(d => d.id === selectedDay)?.day}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b">Time</th>
                          <th className="py-2 px-4 border-b">Temperature (°C)</th>
                          <th className="py-2 px-4 border-b">Heating</th>
                          <th className="py-2 px-4 border-b">Fan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(hours) && hours.map(hour => {
                          const timeSlot = getTimeSlot(selectedDay, hour.id);
                          return (
                            <tr key={hour.id}>
                              <td className="py-2 px-4 border-b">{hour.start_time} - {hour.end_time}</td>
                              <td className="py-2 px-4 border-b">
                                {editMode ? (
                                  <input
                                    type="number"
                                    min="5"
                                    max="40"
                                    step="0.5"
                                    className="w-20 p-1 border rounded"
                                    value={timeSlot?.desired_temperature || 24}
                                    onChange={(e) => handleTimeSlotChange(
                                      selectedDay,
                                      hour.id,
                                      'desired_temperature',
                                      parseFloat(e.target.value)
                                    )}
                                  />
                                ) : (
                                  timeSlot?.desired_temperature || '-'
                                )}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {editMode ? (
                                  <input
                                    type="checkbox"
                                    checked={timeSlot?.is_heating_active || false}
                                    onChange={(e) => handleTimeSlotChange(
                                      selectedDay,
                                      hour.id,
                                      'is_heating_active',
                                      e.target.checked
                                    )}
                                  />
                                ) : (
                                  timeSlot?.is_heating_active ? '✓' : '✗'
                                )}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {editMode ? (
                                  <input
                                    type="checkbox"
                                    checked={timeSlot?.is_fan_active || false}
                                    onChange={(e) => handleTimeSlotChange(
                                      selectedDay,
                                      hour.id,
                                      'is_fan_active',
                                      e.target.checked
                                    )}
                                  />
                                ) : (
                                  timeSlot?.is_fan_active ? '✓' : '✗'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center text-gray-500">
              {schedules.length > 0 
                ? 'Select a schedule from the sidebar' 
                : 'Create a new schedule to get started'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulesTab;