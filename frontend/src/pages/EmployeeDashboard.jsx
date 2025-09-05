import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState("--:--");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeStats, setEmployeeStats] = useState({
    workedHours: 0,
    totalLeaveTaken: 0,
    overtimeApproved: 0,
    performanceScore: 0,
    salary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);

  const API_BASE_URL = "http://localhost:1490/api";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const storedEmployeeData = localStorage.getItem("employeeData");
        if (storedEmployeeData) {
          const parsedData = JSON.parse(storedEmployeeData);
          setEmployeeData(parsedData);

          if (parsedData.id) {
            try {
              const response = await fetch(`${API_BASE_URL}/employees/${parsedData.id}`);
              if (response.ok) {
                const employeeDetails = await response.json();
                if (employeeDetails.employee) {
                  setEmployeeStats({
                    workedHours: employeeDetails.employee.workedHours || 0,
                    totalLeaveTaken: employeeDetails.employee.totalLeaveTaken || 0,
                    overtimeApproved: employeeDetails.employee.overtimeApproved || 0,
                    performanceScore: employeeDetails.employee.performanceScore || 0,
                    salary: employeeDetails.employee.salary || parsedData.salary || 0,
                  });
                }
              }
            } catch (error) {
              console.error("Error fetching employee details:", error);
              setEmployeeStats({
                workedHours: 160,
                totalLeaveTaken: 2,
                overtimeApproved: 12,
                performanceScore: 92,
                salary: 5000,
              });
            }

            fetchTasks(parsedData.id);

            fetchLeaveRequests(parsedData.id);

            fetchOvertimeRequests(parsedData.id);
          }
        }
      } catch (error) {
        console.error("Error loading employee data:", error);
        showAdvancedNotification("Error loading employee data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();

    const storedCheckinTimestamp = localStorage.getItem("checkinTimestamp");
    if (storedCheckinTimestamp) {
      const checkinDate = new Date(storedCheckinTimestamp);
      const time = checkinDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setCheckinTime(time);
      setIsCheckedIn(true);
    }
  }, []);

  const fetchTasks = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(
          data.tasks.map((task) => ({
            id: task._id,
            text: task.description,
            priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
            due: new Date(task.deadline).toLocaleDateString(),
            completed: task.status === "completed",
            color: getPriorityColor(task.priority),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchLeaveRequests = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/leave?employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.leaveRequests);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const fetchOvertimeRequests = async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/overtime?employeeId=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setOvertimeRequests(data.overtimeRequests);
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      case "meeting":
        return "blue";
      default:
        return "gray";
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
    return () => clearInterval(interval);
  }, []);

  const handleCheckInOut = async () => {
    if (!isCheckedIn) {
      try {
        const response = await fetch(`${API_BASE_URL}/checkinout/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: employeeData.id }),
        });

        if (response.ok) {
          const now = new Date();

          localStorage.setItem("checkinTimestamp", now.toISOString());
          const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          setCheckinTime(time);
          setIsCheckedIn(true);
          showAdvancedNotification("Checked in successfully!", "success");
        } else {
          showAdvancedNotification("Error during check-in", "error");
        }
      } catch (error) {
        console.error("Check-in error:", error);
        showAdvancedNotification("Error during check-in", "error");
      }
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/checkinout/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: employeeData.id }),
        });

        const data = await response.json();

        if (response.ok) {
          setEmployeeStats((prevStats) => ({
            ...prevStats,
            workedHours: parseFloat(data.totalWorkedHours.toFixed(2)),
          }));

          localStorage.removeItem("checkinTimestamp");

          setCheckinTime("--:--");
          setIsCheckedIn(false);
          showAdvancedNotification("Checked out successfully!", "info");
        } else {
          showAdvancedNotification(data.message || "Error during check-out", "error");
        }
      } catch (error) {
        console.error("Check-out error:", error);
        showAdvancedNotification("Error during check-out", "error");
      }
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      const newStatus = task.completed ? "pending" : "completed";

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
        if (!task.completed) {
          showAdvancedNotification("Task completed!", "success");
        }
      } else {
        showAdvancedNotification("Error updating task", "error");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      showAdvancedNotification("Error updating task", "error");
    }
  };

  const handleShowReport = async () => {
    setShowModal(true);
    setReportLoading(true);
    setMonthlyReport("");

    if (!employeeData?.id) {
      setMonthlyReport("Could not load report. Employee data not available.");
      setReportLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeData.id}/report`);

      if (response.ok) {
        const data = await response.json();
        setMonthlyReport(data.report || "No report available for this month.");
      } else {
        setMonthlyReport("Failed to load the report. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      setMonthlyReport("An error occurred while fetching the report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);

      const startDate = new Date(formData.get("startDate"));
      const endDate = new Date(formData.get("endDate"));
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const response = await fetch(`${API_BASE_URL}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeData.id,
          leaveType: formData.get("leaveType"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          reason: formData.get("reason"),
          duration: duration,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification("Leave request submitted successfully!", "success");
        e.target.reset();
        fetchLeaveRequests(employeeData.id);
      } else {
        showAdvancedNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      console.error("Leave submission error:", error);
      showAdvancedNotification("Error submitting leave request", "error");
    }
  };

  const handleOvertimeSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);

      const response = await fetch(`${API_BASE_URL}/overtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeData.id,
          date: formData.get("date"),
          hours: parseFloat(formData.get("hours")),
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          reason: formData.get("reason"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification("Overtime request submitted successfully!", "success");
        e.target.reset();
        fetchOvertimeRequests(employeeData.id);
      } else {
        showAdvancedNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      console.error("Overtime submission error:", error);
      showAdvancedNotification("Error submitting overtime request", "error");
    }
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

  const handleLogout = () => {
    showAdvancedNotification("👋 Logging out...", "info");

    localStorage.removeItem("employeeData");
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const FloatingOrb = ({ className, children }) => <div className={`fixed pointer-events-none ${className}`}>{children}</div>;

  const StatCard = ({ icon, title, value, subtitle, progress, gradient }) => (
    <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center`}>{icon}</div>
        <div className="text-right">
          <div className="w-8 h-8">
            <svg className="w-full h-full" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="2" />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="88"
                strokeDashoffset={88 - (progress / 100) * 88}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#06b6d4" }} />
                  <stop offset="100%" style={{ stopColor: "#8b5cf6" }} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <h3 className="text-sm text-gray-400 mb-2 font-medium">{title}</h3>
      <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{value}</p>
      <div className="mt-2 text-xs text-gray-500">{subtitle}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading dashboard...</p>
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
              <span className="text-gray-400 text-sm font-light">Employee Dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShowReport}
                className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 font-medium flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                  <span>Monthly Report</span>
                </span>
              </button>
              <button
                onClick={handleCheckInOut}
                className={`group relative px-6 py-3 rounded-2xl hover:scale-105 transition-all duration-300 ${
                  isCheckedIn ? "bg-gradient-to-r from-red-500 to-pink-600" : "bg-gradient-to-r from-purple-500 to-pink-600"
                }`}
              >
                <span className="relative z-10 font-medium flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isCheckedIn ? "bg-red-400" : "bg-green-400"}`}></div>
                  <span>{isCheckedIn ? "Check Out" : "Check In"}</span>
                </span>
              </button>
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
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Welcome Back!</h2>
              <p className="text-2xl text-gray-300 font-light">{employeeData ? `${employeeData.firstName} ${employeeData.lastName}` : "Employee"}</p>
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
                <span className="text-sm">{employeeData?.officeLocation || "Office Location"}</span>
              </div>
              {employeeData && (
                <div className="flex items-center space-x-4 text-gray-400 text-sm">
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">{employeeData.employmentType}</span>
                  <span className="text-xs text-gray-500">{employeeData.email}</span>
                </div>
              )}
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

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
            title="Check-in Time"
            value={checkinTime}
            subtitle="Today"
            progress={75}
            gradient="from-cyan-500 to-blue-500"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            }
            title="Worked Hours"
            value={`${employeeStats.workedHours}h`}
            subtitle="This month"
            progress={90}
            gradient="from-blue-500 to-indigo-600"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            }
            title="Leave Taken"
            value={`${employeeStats.totalLeaveTaken} days`}
            subtitle="This year"
            progress={40}
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
            title="Overtime Hours"
            value={`${employeeStats.overtimeApproved}h`}
            subtitle="This month"
            progress={65}
            gradient="from-emerald-500 to-teal-500"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                ></path>
              </svg>
            }
            title="Performance"
            value={`${employeeStats.performanceScore}%`}
            subtitle="Excellent"
            progress={employeeStats.performanceScore}
            gradient="from-yellow-500 to-orange-500"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                ></path>
              </svg>
            }
            title="Current Salary"
            value={`$${employeeStats.salary.toLocaleString()}`}
            subtitle="Monthly"
            progress={100}
            gradient="from-green-500 to-emerald-600"
          />
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-3M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  ></path>
                </svg>
              </div>
              <span>Tasks To-Do</span>
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{tasks.filter((task) => !task.completed).length} pending</span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-2xl hover:bg-slate-700/70 transition-all duration-300 border border-slate-600/50 ${
                    task.completed ? "opacity-60" : ""
                  }`}
                >
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className={`flex-1 text-gray-300 group-hover:text-white transition-colors ${task.completed ? "line-through opacity-50" : ""}`}>
                      {task.text}
                    </span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        task.color === "red"
                          ? "bg-red-500/20 text-red-400"
                          : task.color === "yellow"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : task.color === "blue"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">Due: {task.due}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No tasks assigned yet</div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">My Leave Requests</h3>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <div key={request._id} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{request.leaveType}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : request.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">{request.reason}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No leave requests found</div>
              )}
            </div>
          </section>

          <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">My Overtime Requests</h3>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {overtimeRequests.length > 0 ? (
                overtimeRequests.map((request) => (
                  <div key={request._id} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{request.hours} hours</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : request.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{new Date(request.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{request.reason}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No overtime requests found</div>
              )}
            </div>
          </section>
        </div>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Apply for Leave</h3>
          </div>
          <form className="space-y-6" onSubmit={handleLeaveSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Leave Type</label>
                <div className="relative">
                  <select
                    name="leaveType"
                    className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300 appearance-none"
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                  </select>
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Duration (calculated automatically)</label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  placeholder="Will be calculated from dates"
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Reason</label>
              <textarea
                name="reason"
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-cyan-500 focus:outline-none transition-all duration-300 h-32 resize-none"
                placeholder="Provide detailed reason for your leave request"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
              <span>Submit Leave Request</span>
            </button>
          </form>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Apply for Overtime</h3>
          </div>
          <form className="space-y-6" onSubmit={handleOvertimeSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  name="date"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-purple-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Hours</label>
                <input
                  type="number"
                  name="hours"
                  min="1"
                  step="0.5"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-purple-500 focus:outline-none transition-all duration-300"
                  placeholder="Number of overtime hours"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-purple-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-purple-500 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Reason</label>
              <textarea
                name="reason"
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-purple-500 focus:outline-none transition-all duration-300 h-32 resize-none"
                placeholder="Provide detailed reason for your overtime request"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
              <span>Submit Overtime Request</span>
            </button>
          </form>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-3xl p-8 max-w-lg mx-4 border-2 border-slate-700/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Monthly Performance Summary</h3>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed min-h-[100px]">
              {reportLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <p>{monthlyReport}</p>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-slate-700/50 rounded-2xl hover:bg-slate-700 transition-all duration-300 border border-slate-600/50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  showAdvancedNotification("Report downloaded successfully!", "success");
                }}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl hover:scale-105 transition-all duration-300"
              >
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
