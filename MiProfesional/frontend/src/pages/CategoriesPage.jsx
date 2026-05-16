import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
  ArrowRight, LayoutGrid, Monitor, Car, Home, Wifi, Camera, Code, Snowflake,
  Flame, CircleDot, Dog, Sparkles, ChefHat, Shield
} from 'lucide-react';

const iconMap = {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
  Monitor, Car, Home, Wifi, Camera, Code, Snowflake, Flame, CircleDot,
  Dog, Sparkles, ChefHat, Shield,
};

const clusterColors = {
  construccion: 'from-amber-700 to-amber-900',
  'servicios-generales': 'from-primary-700 to-primary-900',
  emergencias: 'from-red-700 to-red-900',
  empresas: 'from-blue-700 to-blue-900',
  tecnologia: 'from-purple-700 to-purple-900',
  automotor: 'from-cyan-700 to-cyan-900',
  hogar: 'from-amber-600 to-amber-800',
  mascotas: 'from-cyan-700 to-cyan-900',
  belleza: 'from-pink-700 to-pink-900',
  gastronomia: 'from-red-700 to-red-900',
  transporte: 'from-blue-700 to-blue-900',
  cerrajeria: 'from-lime-700 to-lime-900',
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Todas las categorias — MiProfesional</title>
        <meta name="description" content="Explora todas las categorias de servicios profesionales en MiProfesional." />
        <link rel="canonical" href="https://miprofesional.com/categorias" />
      </Helmet>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Todas las Categorias</h1>
            <p className="text-gray-500">Explora todos los servicios disponibles en la plataforma</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.sort((a, b) => a.sortOrder - b.sortOrder).map(cat => {
            const Icon = iconMap[cat.icon] || Briefcase;
            const color = clusterColors[cat.slug] || 'from-gray-700 to-gray-900';
            return (
              <Link key={cat._id} to={`/categoria/${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white hover-lift"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={cat.image} alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{cat.title}</h3>
                        <p className="text-xs text-gray-300">{cat.subcategories?.length || 0} servicios</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{cat.description}</p>
                  {cat.subcategories?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {cat.subcategories.slice(0, 6).map((sub, idx) => (
                        <span key={sub._id || idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                          {sub.title}
                        </span>
                      ))}
                      {cat.subcategories.length > 6 && (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-md font-medium">
                          +{cat.subcategories.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{cat.professionalCount || 0} profesionales</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                      Ver categoria <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
