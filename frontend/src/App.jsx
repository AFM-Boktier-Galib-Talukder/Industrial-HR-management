import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HrLogin from "./pages/HrLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<HrLogin />} />
        <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
        <Route path="/adminDashboard" element={<AdminDashboard />} />
        <Route path="/managerDashboard" element={<ManagerDashboard />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
