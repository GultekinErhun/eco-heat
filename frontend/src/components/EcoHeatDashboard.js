import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is now just a redirect to the main dashboard path
const EcoHeatDashboard = () => {
  return <Navigate to="/dashboard" replace />;
};

export default EcoHeatDashboard;