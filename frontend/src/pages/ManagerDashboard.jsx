import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ManagerDashboard = () => {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    officeLocation: "New York Office",
    employmentType: "",
    email: "",
  });

  const [performanceReview, setPerformanceReview] = useState({
    employeeId: "",
    q1: 5,
    q2: 5,
    q3: 5,
    q4: 5,
    q5: 5,
  });

  const [taskAssignment, setTaskAssignment] = useState({
    employeeId: "",
    tasks: [{ description: "", deadline: "", priority: "medium" }],
  });

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE_URL = "http://localhost:1490/api";
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

  useEffect(() => {
    fetchEmployees();
    fetchLeaveRequests();
    fetchOvertimeRequests();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/employees`);
      const data = await response.json();

      if (response.ok) {
        const transformedEmployees = data.employees.map((emp) => ({
          id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          jobTitle: emp.jobTitle || "N/A",
          department: emp.department || "N/A",
          employmentType: emp.employmentType || "general_employee",
          salary: emp.salary || 0,
          shift: emp.shift || "day",
          tasks: [],
        }));

        const employeesWithTasks = await Promise.all(
          transformedEmployees.map(async (employee) => {
            try {
              const taskResponse = await fetch(`${API_BASE_URL}/tasks/${employee.id}`);
              const taskData = await taskResponse.json();

              if (taskResponse.ok) {
                employee.tasks = taskData.tasks.map((task) => ({
                  id: task._id,
                  description: task.description,
                  priority: task.priority,
                  status: task.status,
                  deadline: task.deadline,
                }));
              }
            } catch (error) {
              console.error(`Error fetching tasks for employee ${employee.id}:`, error);
            }
            return employee;
          })
        );

        setEmployees(employeesWithTasks);
      } else {
        setError(data.message || "Failed to fetch employees");
      }
    } catch (error) {
      setError("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leave`);
      const data = await response.json();

      if (response.ok) {
        setLeaveRequests(
          data.leaveRequests.map((req) => ({
            id: req._id,
            employeeId: req.employeeId ? req.employeeId._id : "N/A",
            employeeName: req.employeeName || (req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : "Unknown Employee"),
            leaveType: req.leaveType,
            startDate: new Date(req.startDate).toISOString().split("T")[0],
            endDate: new Date(req.endDate).toISOString().split("T")[0],
            reason: req.reason,
            status: req.status,
            duration: req.duration,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const fetchOvertimeRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/overtime`);
      const data = await response.json();

      if (response.ok) {
        setOvertimeRequests(
          data.overtimeRequests.map((req) => ({
            id: req._id,
            employeeId: req.employeeId ? req.employeeId._id : "N/A",
            employeeName: req.employeeName || (req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : "Unknown Employee"),
            date: new Date(req.date).toISOString().split("T")[0],
            hours: req.hours,
            reason: req.reason,
            status: req.status,
            startTime: req.startTime,
            endTime: req.endTime,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower) ||
      employee.id.toString().includes(searchQuery)
    );
  });

  const handlePerformanceChange = (e) => {
    const { name, value } = e.target;
    setPerformanceReview({
      ...performanceReview,
      [name]: parseInt(value),
    });
  };

  const calculatePerformanceScore = () => {
    const { q1, q2, q3, q4, q5 } = performanceReview;
    return ((q1 + q2 + q3 + q4 + q5) / 5) * 10;
  };

  const handlePerformanceSubmit = async (e) => {
    e.preventDefault();

    const performanceScore = Math.round(calculatePerformanceScore());
    const { employeeId } = performanceReview;

    if (!employeeId) {
      showAdvancedNotification("Please enter an Employee ID.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/performance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          performanceScore,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification(data.message || "Performance score updated successfully", "success");

        setPerformanceReview({
          employeeId: "",
          q1: 5,
          q2: 5,
          q3: 5,
          q4: 5,
          q5: 5,
        });
      } else {
        showAdvancedNotification(`Error: ${data.message}`, "error");
      }
    } catch (error) {
      showAdvancedNotification("Network error: " + error.message, "error");
    }
  };

  const handleTaskChange = (e, index) => {
    const { name, value } = e.target;
    const updatedTasks = [...taskAssignment.tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [name]: value,
    };
    setTaskAssignment({
      ...taskAssignment,
      tasks: updatedTasks,
    });
  };

  const addTaskField = () => {
    if (taskAssignment.tasks.length < 3) {
      setTaskAssignment({
        ...taskAssignment,
        tasks: [...taskAssignment.tasks, { description: "", deadline: "", priority: "medium" }],
      });
    }
  };

  const removeTaskField = (index) => {
    if (taskAssignment.tasks.length > 1) {
      const updatedTasks = [...taskAssignment.tasks];
      updatedTasks.splice(index, 1);
      setTaskAssignment({
        ...taskAssignment,
        tasks: updatedTasks,
      });
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: taskAssignment.employeeId,
          tasks: taskAssignment.tasks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification("Tasks assigned successfully", "success");
        setTaskAssignment({
          employeeId: "",
          tasks: [{ description: "", deadline: "", priority: "medium" }],
        });

        fetchEmployees();
      } else {
        showAdvancedNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Network error: " + error.message, "error");
    }
  };

  const handleLeaveAction = async (id, action) => {
    try {
      const status = action === "accept" ? "approved" : "rejected";
      const response = await fetch(`${API_BASE_URL}/leave/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification(`Leave request ${action}ed successfully`, "success");

        fetchLeaveRequests();

        fetchEmployees();
      } else {
        showAdvancedNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Network error: " + error.message, "error");
    }
  };

  const handleOvertimeAction = async (id, action) => {
    try {
      const status = action === "accept" ? "approved" : "rejected";
      const response = await fetch(`${API_BASE_URL}/overtime/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        showAdvancedNotification(`Overtime request ${action}ed successfully`, "success");

        fetchOvertimeRequests();

        fetchEmployees();
      } else {
        showAdvancedNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      showAdvancedNotification("Network error: " + error.message, "error");
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showAdvancedNotification("Task status updated successfully", "success");

        fetchEmployees();
      } else {
        showAdvancedNotification("Error updating task status", "error");
      }
    } catch (error) {
      showAdvancedNotification("Network error: " + error.message, "error");
    }
  };

  const handleLogout = () => {
    showAdvancedNotification("Logging out...", "info");

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      case "meeting":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-xl text-cyan-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button onClick={() => window.location.reload()} className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-lg transition-colors">
            Retry
          </button>
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
              <span className="text-gray-400 text-sm font-light">Manager Dashboard</span>
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
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Welcome Manager!</h2>
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
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono">{employee.id}</td>
                    <td className="p-4">
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className="p-4">{employee.department}</td>
                    <td className="p-4">
                      <ul className="space-y-2">
                        {employee.tasks.map((task, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                              <span className="text-sm">{task.description}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                              <button
                                onClick={() => handleTaskStatusUpdate(task.id, task.status === "completed" ? "pending" : "completed")}
                                className={`text-xs px-2 py-1 rounded ${
                                  task.status === "completed" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {task.status === "completed" ? "Reopen" : "Complete"}
                              </button>
                            </div>
                          </li>
                        ))}
                        {employee.tasks.length === 0 && <li className="text-gray-500 text-sm">No tasks assigned</li>}
                      </ul>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Employee Performance Review</h3>
          </div>

          <form onSubmit={handlePerformanceSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={performanceReview.employeeId}
                onChange={(e) => setPerformanceReview({ ...performanceReview, employeeId: e.target.value })}
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-green-500 focus:outline-none transition-all duration-300"
                placeholder="Enter employee ID"
                required
              />
            </div>

            <div className="space-y-4 bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Quality of Work</label>
                <span className="">{performanceReview.q1}/10</span>
              </div>
              <input type="range" name="q1" min="0" max="10" value={performanceReview.q1} onChange={handlePerformanceChange} className="w-full" />
            </div>

            <div className="space-y-4 bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Productivity</label>
                <span className="">{performanceReview.q2}/10</span>
              </div>
              <input type="range" name="q2" min="0" max="10" value={performanceReview.q2} onChange={handlePerformanceChange} className="w-full" />
            </div>

            <div className="space-y-4 bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Teamwork</label>
                <span className="">{performanceReview.q3}/10</span>
              </div>
              <input type="range" name="q3" min="0" max="10" value={performanceReview.q3} onChange={handlePerformanceChange} className="w-full" />
            </div>

            <div className="space-y-4 bg-gradient-to-r from-yellow-500 to-amber-600 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Communication</label>
                <span className="">{performanceReview.q4}/10</span>
              </div>
              <input type="range" name="q4" min="0" max="10" value={performanceReview.q4} onChange={handlePerformanceChange} className="w-full" />
            </div>

            <div className="space-y-4 bg-gradient-to-r from-violet-400 to-indigo-600 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Problem Solving</label>
                <span className="">{performanceReview.q5}/10</span>
              </div>
              <input type="range" name="q5" min="0" max="10" value={performanceReview.q5} onChange={handlePerformanceChange} className="w-full" />
            </div>

            <div className="bg-slate-700/50 p-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Overall Performance Score</span>
                <span className="text-2xl font-bold">{calculatePerformanceScore().toFixed(1)}/100</span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-medium"
            >
              Submit Performance Review
            </button>
          </form>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Task Assignment</h3>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Employee ID</label>
              <input
                type="text"
                value={taskAssignment.employeeId}
                onChange={(e) => setTaskAssignment({ ...taskAssignment, employeeId: e.target.value })}
                className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-blue-500 focus:outline-none transition-all duration-300"
                placeholder="Enter employee ID"
                required
              />
            </div>

            {taskAssignment.tasks.map((task, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Task {index + 1}</label>
                  <input
                    type="text"
                    name="description"
                    value={task.description}
                    onChange={(e) => handleTaskChange(e, index)}
                    className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-blue-500 focus:outline-none transition-all duration-300"
                    placeholder="Task description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={task.deadline}
                    onChange={(e) => handleTaskChange(e, index)}
                    className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-blue-500 focus:outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Priority</label>
                  <select
                    name="priority"
                    value={task.priority}
                    onChange={(e) => handleTaskChange(e, index)}
                    className="w-full p-4 bg-slate-700/50 rounded-2xl border border-slate-600 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                {taskAssignment.tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTaskField(index)}
                    className="bg-red-500/20 text-red-400 px-4 py-4 rounded-2xl hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-4">
              {taskAssignment.tasks.length < 3 && (
                <button
                  type="button"
                  onClick={addTaskField}
                  className="bg-blue-500/20 text-blue-400 px-6 py-3 rounded-2xl hover:bg-blue-500/30 transition-colors"
                >
                  Add Another Task
                </button>
              )}
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 rounded-2xl hover:scale-105 transition-all duration-300 font-medium"
              >
                Assign Tasks
              </button>
            </div>
          </form>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">Leave Requests</h3>
          </div>

          <div className="overflow-y-auto h-96">
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No leave requests pending.</div>
            ) : (
              leaveRequests.map((request) => (
                <div key={request.id} className="bg-slate-700/50 p-6 rounded-2xl mb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                      <h4 className="text-lg font-medium">{request.employeeName}</h4>
                      <p className="text-sm text-gray-400">ID: {request.employeeId.slice(-6)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Leave Type</p>
                      <p className="font-medium">{request.leaveType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="font-medium">{request.duration} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Start Date</p>
                      <p className="font-medium">{request.startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">End Date</p>
                      <p className="font-medium">{request.endDate}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400">Reason</p>
                    <p className="font-medium">{request.reason}</p>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleLeaveAction(request.id, "accept")}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-2xl hover:scale-105 transition-all duration-300"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleLeaveAction(request.id, "reject")}
                        className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2 rounded-2xl hover:scale-105 transition-all duration-300"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-700/50 hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Overtime Requests</h3>
          </div>

          <div className="overflow-y-auto h-96">
            {overtimeRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No overtime requests pending.</div>
            ) : (
              overtimeRequests.map((request) => (
                <div key={request.id} className="bg-slate-700/50 p-6 rounded-2xl mb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                      <h4 className="text-lg font-medium">{request.employeeName}</h4>
                      <p className="text-sm text-gray-400">ID: {request.employeeId.slice(-6)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="font-medium">{request.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Hours</p>
                      <p className="font-medium">{request.hours}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Start Time</p>
                      <p className="font-medium">{request.startTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">End Time</p>
                      <p className="font-medium">{request.endTime}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400">Reason</p>
                    <p className="font-medium">{request.reason}</p>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleOvertimeAction(request.id, "accept")}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-2xl hover:scale-105 transition-all duration-300"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleOvertimeAction(request.id, "reject")}
                        className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2 rounded-2xl hover:scale-105 transition-all duration-300"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;
