import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    officeLocation: "New York Office",
    employmentType: "",
    email: "",
  });

  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    jobTitle: "",
    department: "",
    salary: "",
    employmentType: "general_employee",
    shift: "day",
  });

  const [shiftUpdate, setShiftUpdate] = useState({
    id: "",
    shift: "day",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE = "http://localhost:1490/api";
  const navigate = useNavigate();

  useEffect(() => {
    const employeeData = localStorage.getItem("employeeData");
    if (employeeData) {
      try {
        const parsedData = JSON.parse(employeeData);
        setUserInfo({
          firstName: parsedData.firstName || "",
          lastName: parsedData.lastName || "",
          officeLocation: parsedData.officeLocation || "New York Office",
          employmentType: parsedData.employmentType || "",
          email: parsedData.email || "",
        });
      } catch (error) {
        console.error("Error parsing employee data:", error);

        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees`);
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.employees);
      } else {
        showAdvancedNotification("Error fetching employees: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Error connecting to server", "error");
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      setCurrentDateTime(now.toLocaleDateString("en-US", options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    fetchEmployees();

    return () => clearInterval(interval);
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower) ||
      employee._id.toString().includes(searchQuery)
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: value,
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    try {
      const employeeData = {
        ...newEmployee,
        salary: Number(newEmployee.salary),
        address: {
          street: newEmployee.street,
          city: newEmployee.city,
          state: newEmployee.state,
          zipCode: newEmployee.zipCode,
        },
      };

      delete employeeData.street;
      delete employeeData.city;
      delete employeeData.state;
      delete employeeData.zipCode;

      const response = await fetch(`${API_BASE}/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification("✅ Employee added successfully!", "success");

        setNewEmployee({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          jobTitle: "",
          department: "",
          salary: "",
          employmentType: "general_employee",
          shift: "day",
        });

        fetchEmployees();
      } else {
        showAdvancedNotification("Error adding employee: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Error connecting to server", "error");
      console.error("Error adding employee:", error);
    }
  };

  const handleShiftUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/shift`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: shiftUpdate.id,
          shift: shiftUpdate.shift,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification("✅ Shift updated successfully!", "success");
        setShiftUpdate({ id: "", shift: "day" });

        fetchEmployees();
      } else {
        showAdvancedNotification("Error updating shift: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Error connecting to server", "error");
      console.error("Error updating shift:", error);
    }
  };

  const handleShiftInputChange = (e) => {
    const { name, value } = e.target;
    setShiftUpdate({
      ...shiftUpdate,
      [name]: value,
    });
  };

  const handleStartPayroll = async () => {
    showAdvancedNotification("💰 Starting Payroll for all employees...", "info");
    try {
      const payrollPromises = employees.map((employee) =>
        fetch(`${API_BASE}/payroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employeeId: employee._id }),
        })
      );

      const results = await Promise.all(payrollPromises);

      const allOk = results.every((res) => res.ok);

      if (allOk) {
        showAdvancedNotification("✅ Payroll completed successfully for all employees!", "success");
        fetchEmployees();
      } else {
        showAdvancedNotification("Error processing payroll for some employees.", "error");
      }
    } catch (error) {
      showAdvancedNotification("Error connecting to server for payroll", "error");
      console.error("Error starting payroll:", error);
    }
  };

  const handleGenerateReport = async () => {
    showAdvancedNotification("📊 Generating reports for all employees...", "info");
    try {
      const response = await fetch(`${API_BASE}/reports/all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification(`✅ Reports generated for ${data.count} employees!`, "success");
        fetchEmployees();
      } else {
        showAdvancedNotification("Error generating reports: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Error connecting to server for report generation", "error");
      console.error("Error generating report:", error);
    }
  };

  const handleLogout = () => {
    showAdvancedNotification("👋 Logging out...", "info");

    localStorage.removeItem("employeeData");
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const showAdvancedNotification = (message, type) => {
    const colors = {
      success: "from-emerald-500 to-teal-600",
      error: "from-red-500 to-rose-600",
      info: "from-blue-500 to-indigo-600",
      warning: "from-yellow-500 to-orange-600",
    };

    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-2xl text-white shadow-2xl transform transition-all duration-500 ease-out translate-x-full opacity-0 bg-gradient-to-r ${colors[type]} border border-white/20 backdrop-blur-xl`;
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="text-sm">${message}</div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove("translate-x-full", "opacity-0");
    }, 100);

    setTimeout(() => {
      notification.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  };

  const FloatingOrb = ({ className, children }) => <div className={`fixed pointer-events-none ${className}`}>{children}</div>;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen overflow-x-hidden">
      <FloatingOrb className="top-10 left-10 w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-60 animate-pulse" />
      <FloatingOrb className="top-20 right-15 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 animate-bounce" />
      <FloatingOrb className="bottom-15 left-20 w-40 h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-60" />

      <header className="relative z-10 bg-slate-800/80 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">HR Tech</h1>
              <span className="text-gray-400 text-sm font-light">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 font-medium flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Log Out</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Welcome Admin!</h2>
              <p className="text-2xl text-gray-300 font-light">
                {userInfo.firstName} {userInfo.lastName}
              </p>
              <div className="flex items-center space-x-2 text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="text-sm">{userInfo.officeLocation}</span>
              </div>
              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">{userInfo.employmentType}</span>
                <span className="text-xs text-gray-500">{userInfo.email}</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-cyan-300 font-mono">{currentDateTime}</div>
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">Live Time</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={handleStartPayroll}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-3xl border border-slate-700/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-3"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              ></path>
            </svg>
            <span className="text-xl font-bold">Start Payroll</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-3xl border border-slate-700/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-3"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
            <span className="text-xl font-bold">Generate a Report</span>
          </button>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Add New Employee</h3>
          </div>

          <form onSubmit={handleAddEmployee} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newEmployee.firstName}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={newEmployee.lastName}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={newEmployee.phone}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={newEmployee.dateOfBirth}
                onChange={handleInputChange}
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Address</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="street"
                  value={newEmployee.street}
                  onChange={handleInputChange}
                  placeholder="Street"
                  className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  name="city"
                  value={newEmployee.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  name="state"
                  value={newEmployee.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  name="zipCode"
                  value={newEmployee.zipCode}
                  onChange={handleInputChange}
                  placeholder="Zip Code"
                  className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={newEmployee.jobTitle}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Department</label>
                <input
                  type="text"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={newEmployee.salary}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Employment Type</label>
                <select
                  name="employmentType"
                  value={newEmployee.employmentType}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                >
                  <option value="general_employee">General Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Shift</label>
              <select
                name="shift"
                value={newEmployee.shift}
                onChange={handleInputChange}
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
              >
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Add Employee</span>
            </button>
          </form>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span>Employee List</span>
            </h3>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{employees.length} employees</span>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-10 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                placeholder="Search by name, department, or ID..."
              />
            </div>
          </div>

          <div className="overflow-y-auto h-96">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Job Title</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Salary</th>
                  <th className="text-left p-4">Shift</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono text-xs">{employee._id}</td>
                    <td className="p-4">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="p-4">{employee.jobTitle}</td>
                    <td className="p-4">{employee.department}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          employee.employmentType === "Admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : employee.employmentType === "Manager"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {employee.employmentType}
                      </span>
                    </td>
                    <td className="p-4">${employee.salary.toLocaleString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          employee.shift === "day" ? "bg-yellow-500/20 text-yellow-400" : "bg-indigo-500/20 text-indigo-400"
                        }`}
                      >
                        {employee.shift}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && <div className="text-center py-8 text-gray-400">No employees found matching your search.</div>}
          </div>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Shift Management</h3>
          </div>

          <form onSubmit={handleShiftUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Employee ID</label>
                <input
                  type="text"
                  name="id"
                  value={shiftUpdate.id}
                  onChange={handleShiftInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-orange-500 focus:outline-none transition-all duration-300"
                  placeholder="Enter employee ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Shift</label>
                <select
                  name="shift"
                  value={shiftUpdate.shift}
                  onChange={handleShiftInputChange}
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-orange-500 focus:outline-none transition-all duration-300"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  Update Shift
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
