import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

// Custom hook for count-up animation
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

// Intersection observer (safe, non-blocking)
const useIntersectionObserver = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
};

// Metric cards
const METRIC_CARDS = [
  { title: "Total Users", value: 2450, icon: "👥", gradient: "from-teal-400 to-teal-600", textColor: "text-white" },
  { title: "Conversion Rate", value: 68, icon: "📈", gradient: "from-orange-400 to-orange-600", textColor: "text-white" },
  { title: "Active Reports", value: 142, icon: "📊", gradient: "from-blue-400 to-blue-600", textColor: "text-white" },
  { title: "Avg. Sentiment", value: 82, icon: "😊", gradient: "from-emerald-400 to-emerald-600", textColor: "text-white" },
];

const ProfessionalInsightsDashboard = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const darkMode = theme === "dark";

  // 🎯 THEME TOKENS
  const bg = darkMode ? "bg-slate-950" : "";
  const card = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white/80 border-white/30";

  const headingPrimary = darkMode ? "text-white" : "text-gray-900";
  const headingMuted = darkMode ? "text-slate-400" : "text-gray-600";

  const chartGridColor = darkMode ? "#1e293b" : "rgba(229,231,235,0.5)";
  const chartTextColor = darkMode ? "#94a3b8" : "#9CA3AF";
  const chartLineColor = darkMode ? "#a78bfa" : "#7c3aed";

  const userCanvasRef = useRef(null);
  const feedbackCanvasRef = useRef(null);

  const userChartRef = useRef(null);
  const feedbackChartRef = useRef(null);

  const chartsContainerRef = useRef(null);
  const isChartsVisible = useIntersectionObserver(chartsContainerRef);

  // ✅ FIXED: no blocking, safe initialization
  useEffect(() => {
    if (!userCanvasRef.current || !feedbackCanvasRef.current) return;

    // Destroy old charts if they exist
    userChartRef.current?.destroy();
    feedbackChartRef.current?.destroy();

    // LINE CHART
    userChartRef.current = new Chart(userCanvasRef.current, {
      type: "line",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        datasets: [{
          label: "Users",
          data: [400,450,520,580,650,720,800,950,1100,1300,1800,2450],
          borderColor: chartLineColor,
          backgroundColor: `${chartLineColor}22`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        plugins: {
          legend: {
            labels: { color: chartTextColor }
          },
          tooltip: {
            backgroundColor: darkMode ? "#1e293b" : "#fff",
            titleColor: darkMode ? "#fff" : "#000",
            bodyColor: chartTextColor,
          }
        },
        scales: {
          x: {
            grid: { color: chartGridColor },
            ticks: { color: chartTextColor }
          },
          y: {
            grid: { color: chartGridColor },
            ticks: { color: chartTextColor }
          }
        }
      }
    });

    // DOUGHNUT CHART
    feedbackChartRef.current = new Chart(feedbackCanvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Positive", "Neutral", "Negative"],
        datasets: [{
          data: [65, 25, 10],
          backgroundColor: ["#a78bfa", "#fbbf24", "#ef4444"],
          borderColor: darkMode ? "#0f172a" : "#fff"
        }]
      },
      options: {
        plugins: {
          legend: {
            labels: { color: chartTextColor }
          }
        }
      }
    });

    return () => {
      userChartRef.current?.destroy();
      feedbackChartRef.current?.destroy();
    };

  }, [darkMode]); // ✅ stable dependency

  // Metric card
  const MetricCard = ({ title, value, icon, gradient, textColor }) => {
    const count = useCountUp(value);

    return (
      <div className={`rounded-2xl p-6 border bg-gradient-to-br ${gradient}`}>
        <div className="flex justify-between mb-2">
          <p className={`text-sm font-semibold ${headingMuted}`}>
            {title}
          </p>
          <span>{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${textColor}`}>
          {count}
        </p>
      </div>
    );
  };

  return (
    <main className={`min-h-screen ${bg}`}>
      <div className="max-w-7xl mx-auto p-8">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className={`text-4xl font-bold ${headingPrimary}`}>
            Dashboard Overview
          </h1>
          <p className={`text-lg ${headingMuted}`}>
            Real-time analytics
          </p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {METRIC_CARDS.map((c, i) => (
            <MetricCard key={i} {...c} />
          ))}
        </div>

        {/* CHARTS */}
        <div ref={chartsContainerRef} className="grid lg:grid-cols-3 gap-6">

          <div className={`lg:col-span-2 p-6 rounded-2xl border ${card}`}>
            <h3 className={`font-bold ${headingPrimary}`}>
              User Growth
            </h3>
            <canvas ref={userCanvasRef} />
          </div>

          <div className={`p-6 rounded-2xl border ${card}`}>
            <h3 className={`font-bold ${headingPrimary}`}>
              Sentiment
            </h3>
            <canvas ref={feedbackCanvasRef} />
          </div>

        </div>

      </div>
    </main>
  );
};

export default ProfessionalInsightsDashboard;