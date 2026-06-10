import React from "react";
import * as Icons from "lucide-react";

const StatCard = ({ title, value, iconName, change, colorClass }) => {
  // Find icon from lucide-react
  const Icon = Icons[iconName] || Icons["CircleAlert"]; // ✔ fallback icon

  const textColor = colorClass.replace("bg-", "text-");

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>

        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={20} className={textColor} />
        </div>
      </div>

      <div className="mt-4 text-xs flex items-center">
        <span className="text-green-500 font-bold mr-1">↑ {change}</span>
        <span className="text-slate-400">vs last month</span>
      </div>
    </div>
  );
};

export default StatCard;
