import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, User, Clock } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== user?.id) || {};
  };

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mensajes</h1>

      {conversations.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            return (
              <Link key={conv._id} to={`/chat/${other._id}`}
                className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-primary-600" size={24} />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{other.name || 'Usuario'}</p>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage.text}</p>
                  )}
                </div>
                {conv.lastMessage?.createdAt && (
                  <div className="ml-4 text-xs text-gray-400">
                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin mensajes</h3>
          <p className="text-gray-500">Cuando contactes a un profesional, tus mensajes aparecerán aquí</p>
        </div>
      )}
    </div>
  );
};

export default Messages;
