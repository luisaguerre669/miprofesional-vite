import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send, User } from 'lucide-react';

const Chat = () => {
  const { userId: otherUserId } = useParams();
  const { user } = useAuth();
  const { socket, connected, sendMessage, joinRoom } = useSocket();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversation();
  }, [otherUserId]);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      joinRoom(conversation._id);
    }
  }, [conversation]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      if (message.conversationId === conversation?._id) {
        setMessages(prev => [...prev, message]);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const response = await api.get(`/chat/conversations/${otherUserId}`);
      setConversation(response.data.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${conversation._id}/messages`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      if (socket && connected) {
        sendMessage({ conversationId: conversation._id, text: text.trim() });
      } else {
        const response = await api.post(`/chat/${conversation._id}/messages`, { text: text.trim() });
        setMessages(prev => [...prev, response.data.data]);
      }
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="animate-pulse"><div className="h-16 bg-gray-200 rounded-xl mb-4" /><div className="h-96 bg-gray-200 rounded-xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center">
          <Link to="/messages" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="text-primary-600" size={20} />
          </div>
          <div className="ml-3">
            <p className="font-medium">Chat</p>
            {connected && <p className="text-xs text-green-600">Conectado</p>}
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg._id} className={`flex ${msg.senderId === user?.id || msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === user?.id || msg.senderId === user?._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.senderId === user?.id || msg.senderId === user?._id ? 'text-primary-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..." className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button type="submit" disabled={sending || !text.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
