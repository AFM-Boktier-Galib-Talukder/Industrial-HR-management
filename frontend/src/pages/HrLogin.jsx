import React, { useState, useEffect } from "react";

const HrLogin = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.getElementById("particles");
      if (!particlesContainer) return;

      const particleCount = 50;
      particlesContainer.innerHTML = "";

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "absolute w-0.5 h-0.5 bg-cyan-400 rounded-full opacity-60";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDelay = Math.random() * 20 + "s";
        particle.style.animationDuration = Math.random() * 10 + 10 + "s";
        particle.style.animation = `float ${Math.random() * 10 + 10}s infinite linear ${Math.random() * 20}s`;
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();
  }, []);

  const handleLogin = async () => {
    if (!email || !phone) {
      setNotificationMessage("Please fill all fields");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:1490/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, phone }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("employeeData", JSON.stringify(data.employee));

        setNotificationMessage("Login Successful");
        setShowNotification(true);

        setTimeout(() => {
          window.location.href = data.redirectTo;
        }, 2000);
      } else {
        setNotificationMessage(data.message || "Login failed");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setNotificationMessage("Network error. Please try again.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToLogin = () => {
    document.getElementById("login-section").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900 text-white overflow-x-hidden">
      <div id="particles" className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
          }
          to {
            text-shadow: 0 0 60px rgba(255, 0, 255, 0.5), 0 0 80px rgba(255, 255, 0, 0.3);
          }
        }

        @keyframes bounce {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        .glow-text {
          background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glow 2s ease-in-out infinite alternate;
        }

        .scroll-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>

      {showNotification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notificationMessage === "Login Successful"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
              : "bg-gradient-to-r from-red-500 to-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMessage === "Login Successful" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            {notificationMessage}
          </div>
        </div>
      )}

      <section className="min-h-screen flex items-center justify-center text-center px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 glow-text">Next-Gen HR Management</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Revolutionize your workforce management with all new Technology, Seamless automation, and Cutting-Edge Technology. Experience the future of Human
            Resources today.
          </p>
        </div>
        <button onClick={scrollToLogin} className="absolute bottom-8 left-1/2 text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors scroll-bounce">
          <div className="text-4xl mb-2">↓</div>
          <div className="text-sm">Scroll to explore</div>
        </button>
      </section>

      <section id="login-section" className="min-h-screen flex items-center justify-center px-8 relative z-10">
        <div className="bg-black/50 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">HR Tech</span>
            </div>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-black/30 border border-cyan-400/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-black/30 border border-cyan-400/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={!email || !phone || isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : !email || !phone ? (
                "Please fill all fields"
              ) : (
                "Login"
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">Secure login with enterprise-grade encryption</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HrLogin;
