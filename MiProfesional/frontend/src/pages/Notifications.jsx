import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import api from '../lib/axios';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'alert': return <AlertCircle className="text-red-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-gray-600">{unreadCount} sin leer</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
            Marcar todo leído
          </button>
        )}
      </div>

      <div className="flex space-x-2">
        {['all', 'success', 'info', 'alert'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}>
            {f === 'all' ? 'Todas' : f === 'success' ? 'Éxito' : f === 'info' ? 'Información' : 'Alertas'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((n) => (
          <div key={n._id}
            className={`bg-white rounded-xl shadow-sm p-4 flex items-start space-x-4 transition-all ${
              !n.read ? 'ring-2 ring-primary-100' : ''
            }`}>
            <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.text || n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">{new Date(n.createdAt || n.date).toLocaleDateString()}</span>
                  {!n.read && (
                    <button onClick={() => markAsRead(n._id)} className="text-primary-600 hover:text-primary-800">
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-16">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin notificaciones</h3>
            <p className="text-gray-500">No hay notificaciones que mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
