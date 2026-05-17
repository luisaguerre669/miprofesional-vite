import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
  Star, MapPin, Clock, Phone, Mail, CheckCircle, ArrowLeft, Calendar,
  MessageSquare, Shield, Award, BadgeCheck, Share2, ChevronRight,
  Wifi, Heart, AlertCircle, Quote, Camera, Image as ImageIcon,
  ChevronLeft, X
} from 'lucide-react';

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : i === Math.ceil(rating) && rating % 1 >= 0.5 ? 'fill-amber-400/50 text-amber-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(null);
  const [bookingData, setBookingData] = useState({ date: '', time: '', serviceName: '', notes: '' });

  useEffect(() => {
    Promise.all([
      api.get(`/professionals/${id}`).then(r => r.data.data).catch(() => null),
      api.get(`/ratings/professional/${id}`).then(r => r.data.data || []).catch(() => []),
    ]).then(([pro, revs]) => {
      setProfessional(pro);
      setReviews(revs);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    try {
      await api.post('/bookings', {
        professionalId: id,
        serviceName: bookingData.serviceName || professional?.profession,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
        price: professional?.pricing?.hourlyRate || 0
      });
      alert('Reserva creada exitosamente');
      setShowBooking(false);
    } catch (error) {
      alert('Error al crear reserva');
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-8 w-1/3" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-32" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!professional) return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <AlertCircle size={56} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Profesional no encontrado</h2>
      <Link to="/search" className="text-primary-600 font-medium">Volver al marketplace</Link>
    </div>
  );

  const p = professional;
  const workPhotos = p.workPhotos || p.gallery?.filter(Boolean).map(u => ({ url: u, caption: '' })) || [];
  const hasGallery = workPhotos.length > 0;
  const workingHours = p.availability?.workingHours || {};
  const today = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

  return (
    <>
    <Helmet>
      <title>{p.businessName || p.profession} — MiProfesional</title>
      <meta name="description" content={p.description?.slice(0, 160) || `Perfil de ${p.businessName || p.profession} en MiProfesional. ${p.location?.city ? `Ubicado en ${p.location.city}.` : ''} ${p.stats?.rating ? `Valoración: ${p.stats.rating.toFixed(1)} estrellas.` : ''}`} />
      <meta property="og:title" content={`${p.businessName || p.profession} — Profesional en MiProfesional`} />
      {p.avatar && <meta property="og:image" content={p.avatar} />}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={`https://www.miprofesional.online/profesional/${p._id}`} />
    </Helmet>
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-600">Inicio</Link>
        <ChevronRight size={14} />
        <Link to="/search" className="hover:text-primary-600">Profesionales</Link>
        <ChevronRight size={14} />
        <span className="text-gray-600 truncate">{p.businessName || p.profession}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="md:col-span-2 space-y-8">
          {/* Cover + Avatar */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-premium-dark via-premium-card to-premium-dark border border-premium-border">
            <div className="h-56 md:h-72 relative overflow-hidden">
              {workPhotos[0]?.url ? (
                <img src={workPhotos[0].url} alt="" className="w-full h-full object-cover opacity-60" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-premium-dark via-premium-dark/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-end gap-5">
                  <div className="relative shrink-0">
                    <img src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.businessName || p.profession)}&background=4f46e5&color=fff&size=120`}
                      alt={p.businessName || p.profession}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
                    />
                    {p.verification?.isVerified && (
                      <BadgeCheck size={24} className="absolute -bottom-1 -right-1 text-primary-400 bg-premium-dark rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{p.businessName || p.profession}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-primary-300 text-sm">{p.profession}</span>
                      <span className="text-gray-500 text-xs">·</span>
                      <div className="flex items-center gap-1">
                        <StarRating rating={p.stats?.rating || 0} size={14} />
                        <span className="text-sm font-medium text-white">{(p.stats?.rating || 0).toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">({p.stats?.reviewCount || 0})</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      {p.stats?.completedBookings > 0 && (
                        <span className="flex items-center gap-1"><CheckCircle size={12} className="text-brand-emerald" />{p.stats.completedBookings} trabajos</span>
                      )}
                      {p.isFeatured && (
                        <span className="flex items-center gap-1"><Award size={12} className="text-amber-400" />Destacado</span>
                      )}
                      {p.pricing?.hourlyRate > 0 && (
                        <span className="flex items-center gap-1 text-white font-semibold">${p.pricing.hourlyRate.toLocaleString()}/hora</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery strip */}
            {hasGallery && (
              <div className="px-6 md:px-8 pb-6 pt-4">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {workPhotos.map((img, i) => (
                    <button key={i} onClick={() => setGalleryIdx(i)}
                      className="shrink-0 w-20 h-20 rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-primary-500/50 transition-all group relative"
                    >
                      <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" loading="lazy" />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                          <p className="text-[8px] text-white truncate">{img.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acerca de</h2>
            <p className="text-gray-600 leading-relaxed">{p.description || 'Sin descripción disponible.'}</p>

            {/* Specialties */}
            {p.specialties?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {p.specialties.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {p.location?.city && (
              <div className="mt-6 flex items-start gap-2 text-gray-600">
                <MapPin size={18} className="shrink-0 mt-0.5 text-gray-400" />
                <span className="text-sm">{p.location.address ? `${p.location.address}, ` : ''}{p.location.city}{p.location.state ? `, ${p.location.state}` : ''}</span>
              </div>
            )}
          </div>

          {/* Services */}
          {p.services?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Servicios</h2>
              <div className="space-y-3">
                {p.services.filter(s => s.isActive !== false).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-primary-600 text-lg">${s.price?.toLocaleString()}</p>
                      {s.duration && <p className="text-xs text-gray-400">{s.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {p.location?.coordinates?.lat && p.location?.coordinates?.lng && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h2>
              <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: '300px' }}>
                <div style={{ height: '100%', width: '100%' }}>
                  <iframe
                    title="Ubicación"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.location.coordinates.lng - 0.02},${p.location.coordinates.lat - 0.02},${p.location.coordinates.lng + 0.02},${p.location.coordinates.lat + 0.02}&layer=mapnik&marker=${p.location.coordinates.lat},${p.location.coordinates.lng}`}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {p.location.address ? `${p.location.address}, ` : ''}{p.location.city}{p.location.state ? `, ${p.location.state}` : ''}
              </p>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Reseñas
                <span className="text-gray-400 font-normal text-base ml-2">({reviews.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <StarRating rating={p.stats?.rating || 0} size={16} />
                <span className="font-bold text-gray-900">{(p.stats?.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 10).map((review, i) => (
                  <div key={review._id || i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                        {review.fromUser?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{review.fromUser?.name || 'Usuario'}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size={12} />
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600 ml-12">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Star size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aun no hay resenas. Se el primero!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Contacto</h3>

            {/* Pricing */}
            {p.pricing?.hourlyRate > 0 && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tarifa por hora</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">${p.pricing.hourlyRate.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/hora</span>
                </div>
                {p.pricing?.currency && <p className="text-xs text-gray-400 mt-0.5">{p.pricing.currency}</p>}
              </div>
            )}

            {/* Contact info */}
            <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
              {p.contact?.phone && (
                <a href={`tel:${p.contact.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Phone size={16} className="text-primary-600" />
                  </div>
                  <span>{p.contact.phone}</span>
                </a>
              )}
              {p.contact?.email && (
                <a href={`mailto:${p.contact.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Mail size={16} className="text-primary-600" />
                  </div>
                  <span className="truncate">{p.contact.email}</span>
                </a>
              )}
              {p.contact?.whatsapp && (
                <a href={`https://wa.me/${p.contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <MessageSquare size={16} className="text-green-600" />
                  </div>
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            {/* Availability */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Disponibilidad</h4>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${p.availability?.isAvailable !== false ? 'text-brand-emerald' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${p.availability?.isAvailable !== false ? 'bg-brand-emerald' : 'bg-red-500'}`} />
                  {p.availability?.isAvailable !== false ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                  const wh = workingHours[day];
                  const isToday = day === today;
                  return (
                    <div key={day} className={`flex justify-between py-0.5 ${isToday ? 'text-primary-600 font-medium' : ''}`}>
                      <span className="capitalize">{day.slice(0, 3)}</span>
                      <span>{wh && !wh.closed ? `${wh.open} - ${wh.close}` : 'Cerrado'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {isAuthenticated ? (
                <>
                  <button onClick={() => setShowBooking(!showBooking)}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    {showBooking ? 'Cerrar' : 'Reservar Ahora'}
                  </button>
                  <Link to={`/chat/${p.userId?._id || p.userId}`}
                    className="w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-primary-600 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Enviar Mensaje
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    Inicia Sesión para Reservar
                  </Link>
                  <Link to="/register"
                    className="w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-primary-600 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                  >
                    Crear Cuenta
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Rating', value: (p.stats?.rating || 0).toFixed(1), icon: Star, color: 'text-amber-500' },
                { label: 'Reseñas', value: p.stats?.reviewCount || 0, icon: Star, color: 'text-blue-500' },
                { label: 'Trabajos', value: p.stats?.completedBookings || 0, icon: CheckCircle, color: 'text-brand-emerald' },
                { label: 'Respuesta', value: p.stats?.responseTime || '-', icon: Clock, color: 'text-gray-500' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                    <Icon size={18} className={`mx-auto mb-1 ${s.color}`} />
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowBooking(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nueva Reserva</h3>
              <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <input type="text" value={bookingData.serviceName}
                  onChange={e => setBookingData({ ...bookingData, serviceName: e.target.value })}
                  placeholder={p.profession} className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input type="time" value={bookingData.time}
                    onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={bookingData.notes}
                  onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Describe tu necesidad..." rows={3}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-emerald to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-700 transition-all shadow-lg"
              >
                Confirmar Reserva
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {galleryIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setGalleryIdx(null)}>
          <button onClick={() => setGalleryIdx(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10">
            <X size={28} />
          </button>
          <button onClick={e => { e.stopPropagation(); setGalleryIdx(prev => (prev - 1 + workPhotos.length) % workPhotos.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          >
            <ChevronLeft size={32} />
          </button>
          <button onClick={e => { e.stopPropagation(); setGalleryIdx(prev => (prev + 1) % workPhotos.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          >
            <ChevronRight size={32} />
          </button>
          <div className="flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img src={workPhotos[galleryIdx]?.url} alt={workPhotos[galleryIdx]?.caption || ''}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl" />
            {workPhotos[galleryIdx]?.caption && (
              <p className="mt-3 text-white/70 text-sm">{workPhotos[galleryIdx].caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ServiceDetail;