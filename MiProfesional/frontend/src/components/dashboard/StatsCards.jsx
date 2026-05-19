import { useState, useEffect } from 'react';
import { TrendingUp, Eye, MousePointerClick, MessageCircle, Heart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const weeklyData = [
  { day: 'Lun', visitas: 45, clics: 22, contactos: 8 },
  { day: 'Mar', visitas: 62, clics: 31, contactos: 12 },
  { day: 'Mie', visitas: 58, clics: 27, contactos: 10 },
  { day: 'Jue', visitas: 74, clics: 35, contactos: 15 },
  { day: 'Vie', visitas: 89, clics: 42, contactos: 18 },
  { day: 'Sab', visitas: 51, clics: 24, contactos: 9 },
  { day: 'Dom', visitas: 38, clics: 18, contactos: 6 },
];

const monthlyData = [
  { mes: 'Ene', visitas: 320, contactos: 45 },
  { mes: 'Feb', visitas: 380, contactos: 52 },
  { mes: 'Mar', visitas: 420, contactos: 58 },
  { mes: 'Abr', visitas: 490, contactos: 63 },
  { mes: 'May', visitas: 540, contactos: 71 },
  { mes: 'Jun', visitas: 610, contactos: 82 },
];

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const DashboardStats = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Eye} label="Visitas al perfil" value="1,247" trend="+12%" color="bg-blue-500" />
        <StatCard icon={MousePointerClick} label="Clics en contacto" value="389" trend="+8%" color="bg-emerald-500" />
        <StatCard icon={MessageCircle} label="Mensajes recibidos" value="124" trend="+23%" color="bg-violet-500" />
        <StatCard icon={Heart} label="Favoritos" value="56" trend="+5%" color="bg-rose-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Visitas semanales</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f7a5a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f7a5a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="visitas" stroke="#0f7a5a" strokeWidth={2} fill="url(#visitsGrad)" />
              <Line type="monotone" dataKey="clics" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="contactos" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Visitas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Clics</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Contactos</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Crecimiento mensual</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="visitas" fill="#0f7a5a" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="contactos" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary-500" /> Visitas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Contactos</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
