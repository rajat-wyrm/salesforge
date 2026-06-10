import {
  AlertTriangle,
  CheckCircle,
  ChevronsRight,
  Download,
  MoreVertical,
  Users,
} from "lucide-react";
import React, { Activity } from "react";
import StatCard from "./StatCard";

const AdminMainLayout = () => {
  // Mock Data for Users Table
  const recentUsers = [
    {
    //   id: 1,
    //   name: "Devansh",
    //   email: "devansh@corp.com",
    //   role: "User",
    //   status: "Active",
    //   date: "2023-10-24",
    // },
    // {
    //   id: 2,
    //   name: "Ankit",
    //   email: "Ankit@tech.io",
    //   role: "User",
    //   status: "Pending",
    //   date: "2023-10-23",
    // },
    // {
    //   id: 3,
    //   name: "Heena",
    //   email: "Heena@mail.com",
    //   role: "Editor",
    //   status: "Active",
    //   date: "2023-10-22",
    // },
    // {
    //   id: 4,
    //   name: "Anmol",
    //   email: "Anmol@global.net",
    //   role: "User",
    //   status: "Inactive",
    //   date: "2023-10-20",
    },
  ];

  return (
    <main className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="00"
          icon={Users}
          change="0%"
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Active Licenses"
          value="00"
          icon={CheckCircle}
          change="0%"
          colorClass="bg-green-500"
        />
        <StatCard
          title="Pending Alerts"
          value="00"
          icon={AlertTriangle}
          change="0%"
          colorClass="bg-amber-500"
        />
        <StatCard
          title="Server Load"
          value="00"
          icon={Activity}
          change="0%"
          colorClass="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Table Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">
              Recent Registrations
            </h3>
            <button className="text-sm text-teal-600 font-medium hover:underline flex items-center">
              View All <ChevronsRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-slate-900">
                        {user.name}
                      </div>
                      <div className="text-slate-500 text-xs">{user.email}</div>
                    </td>
                    <td className="p-4 text-slate-600">{user.role}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : user.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{user.date}</td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">System Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Database API</span>
                  <span className="text-green-600 font-medium">
                    Operational
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[0%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Search Engine</span>
                  <span className="text-green-600 font-medium">
                    Operational
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[0%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Email Relay</span>
                  <span className="text-amber-500 font-medium">
                    High Latency
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-[0%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center bg-blend-overlay bg-opacity-90">
            <h3 className="font-bold text-lg mb-2">Admin Tools</h3>
            <p className="text-slate-300 text-sm mb-4">
              Quickly generate reports or manage system backups.
            </p>
            <div className="flex flex-col gap-2">
              <button className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> Generate Monthly Report
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                View Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminMainLayout;