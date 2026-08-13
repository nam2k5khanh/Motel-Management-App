// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'

import LandLord from './pages/LandLord/LandLordDashboard'
import MotelManagement from './pages/LandLord/MotelManagement';
import RoomManagement from './pages/LandLord/RoomManagement';
import TenantManagement from './pages/LandLord/TenantManagement'
import ContractManagement from './pages/LandLord/ContractManagement'
import ElectricityWaterManagement from './pages/LandLord/ElectricityWaterManagement';
import InvoiceManagement from './pages/LandLord/InvoiceManagement';
import StatisticsPage from './pages/LandLord/StatisticsPage';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ManagerRoomManagement from './pages/Manager/ManagerRoomManagement';
import ManagerTenantManagement from './pages/Manager/ManagerTenantManagement';
import ManagerAccountManagement from './pages/LandLord/ManagerAccountManagement';
import AccountSettings from './pages/AccountSettings';
import TenantDashboard from './pages/Tenant/TenantDashboard';
import TenantContract from './pages/Tenant/TenantContract';
import TenantBill from './pages/Tenant/TenantBill';
import LandlordBankSettings from './pages/LandLord/LandlordBankSettings';
import TenantRepairRequest from './pages/Tenant/TenantRepairRequest';
import LandlordRepairManagement from './pages/LandLord/LandlordRepairManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<AccountSettings />} />
        
        <Route path="/landlord" element={<LandLord />} />
        <Route path="/motelmanagement" element={<MotelManagement />} />
        <Route path="/roommanagement" element={<RoomManagement />} />
        <Route path="/tenantmanagement" element={<TenantManagement />} />
        <Route path="/contractmanagement" element={<ContractManagement />} />
        <Route path="/utilitymanagement" element={<ElectricityWaterManagement />} />
        <Route path="/invoicemanagement" element={<InvoiceManagement />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/managers" element={<ManagerAccountManagement />} />
        <Route path="/bankSettings" element={<LandlordBankSettings />} />
        <Route path="/repair" element={<LandlordRepairManagement />} />

        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/rooms" element={<ManagerRoomManagement />} />
        <Route path="/manager/tenants" element={<ManagerTenantManagement />} />
        <Route path="/manager/electricitywater" element={<ElectricityWaterManagement />} />

        <Route path="/tenant" element={<TenantDashboard />} />
        <Route path="/tenant/contract" element={<TenantContract />} />
        <Route path="/tenant/bills" element={<TenantBill />} />
        <Route path="/tenant/issues" element={<TenantRepairRequest />} />
      </Routes>
    </Router>
  );
}

export default App;