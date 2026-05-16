import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPaymentsDashboard() {
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, auditRes] = await Promise.all([
          fetch(`${API}/api/v1/mercadopago/payments/stats`),
          fetch(`${API}/api/v1/mercadopago/payments/audit`)
        ]);

        const statsData = await statsRes.json();
        const auditData = await auditRes.json();

        setStats(statsData);
        setAudit(auditData);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-white">
        Cargando dashboard de pagos...
      </div>
    );
  }

  const chartData = (stats?.dailyRevenue || []).map((d) => ({
    date: d.date,
    revenue: d.total,
  }));

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold">Admin Payments Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm opacity-70">Ingresos Totales</p>
            <p className="text-xl font-bold">${stats?.totalRevenue || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm opacity-70">Pagos Exitosos</p>
            <p className="text-xl font-bold">{stats?.successfulPayments || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm opacity-70">Fallidos</p>
            <p className="text-xl font-bold">{stats?.failedPayments || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm opacity-70">Ticket Promedio</p>
            <p className="text-xl font-bold">${stats?.averageTicket || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4">Ingresos en el tiempo</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4">Auditoría de Pagos</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {audit.slice(0, 20).map((event, idx) => (
              <div key={idx} className="text-sm border-b border-gray-800 py-2">
                <p><b>{event.event}</b></p>
                <p className="opacity-70">Payment: {event.paymentId}</p>
                <p className="opacity-50 text-xs">{event.timestamp}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>
          Refrescar
        </Button>
      </div>
    </div>
  );
}
