
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Weigh from './pages/Weigh';
import AddFarmer from './pages/AddFarmer';
import Farmers from './pages/Farmers';
import Payment from './pages/Payment';
import Price from './pages/Price';
import Report from './pages/Report';
import Vehicles from './pages/Vehicles';
import AddVehicle from './pages/AddVehicle';
import Branches from './pages/Branches';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Products from './pages/Products';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e] text-[#2d6a4f] font-medium">กำลังโหลด...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Protected Routes inside Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="weigh" element={<Weigh />} />
        <Route path="farmers" element={<Farmers />} />
        <Route path="farmers/new" element={<AddFarmer />} />
        <Route path="farmers/:id" element={<AddFarmer />} />
        <Route path="payment" element={<Payment />} />
        <Route path="price" element={<Price />} />
        <Route path="report" element={<Report />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="vehicles/new" element={<AddVehicle />} />
        <Route path="vehicles/:id" element={<AddVehicle />} />
        <Route path="branches" element={<Branches />} />
        <Route path="sales" element={<Sales />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="products" element={<Products />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
