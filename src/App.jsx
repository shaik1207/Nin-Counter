import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScanReceipt from "./pages/ScanReceipt";
import PendingOrders from "./pages/PendingOrders";
import ServedOrders from "./pages/ServedOrders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings"; // Imported the new Settings component
import LockScreen from "./pages/LockScreen";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuth") === "true";

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/lock" element={<LockScreen />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <ScanReceipt />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/pending"
          element={
            <ProtectedRoute>
              <PendingOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/served"
          element={
            <ProtectedRoute>
              <ServedOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* --- ADDED SETTINGS ROUTE HERE --- */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                localStorage.getItem("isAuth") === "true"
                  ? "/dashboard"
                  : "/"
              }
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}