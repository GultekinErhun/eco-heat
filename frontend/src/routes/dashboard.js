import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import HomeTab from '../components/HomeTab';
import RoomsTab from '../components/RoomsTab';
import SchedulesTab from '../components/SchedulesTab';

function Dashboard() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeTab />} />
          <Route path="/rooms" element={<RoomsTab />} />
          <Route path="/schedules" element={<SchedulesTab />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;