require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
require('../models/Professional');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

const categories = [
  {
    title: 'Construccion',
    slug: 'construccion',
    description: 'Albaniles, plomeros, electricistas, gasistas, pintores, carpinteros, techistas, herreros y mas.',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80',
    icon: 'Building2',
    metadata: { color: '#b45309', featured: true },
    sortOrder: 1,
    subcategories: [
      { title: 'Albanil', slug: 'albanil', description: 'Construccion y reparacion de estructuras', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Hammer' },
      { title: 'Plomero', slug: 'plomero', description: 'Instalaciones hidraulicas y sanitarias', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Droplets' },
      { title: 'Electricista', slug: 'electricista', description: 'Instalacion y reparacion electrica', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: 'Zap' },
      { title: 'Gasista', slug: 'gasista', description: 'Instalacion y mantenimiento de gas', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Flame' },
      { title: 'Pintor', slug: 'pintor', description: 'Pintura interior y exterior', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80', icon: 'Paintbrush' },
      { title: 'Carpintero', slug: 'carpintero', description: 'Muebles y trabajos en madera', image: 'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=600&q=80', icon: 'Hammer' },
      { title: 'Techista', slug: 'techista', description: 'Techos y cubiertas', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Building2' },
      { title: 'Herrero', slug: 'herrero', description: 'Estructuras metalicas y soldadura', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Hammer' },
      { title: 'Colocador de Pisos', slug: 'colocador-pisos', description: 'Instalacion de pisos y revestimientos', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Tool' },
      { title: 'Yesero', slug: 'yesero', description: 'Revoques y yeso', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Tool' },
      { title: 'Impermeabilizacion', slug: 'impermeabilizacion', description: 'Impermeabilizacion de techos y terrazas', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Tool' },
      { title: 'Aberturas y Ventanas', slug: 'aberturas', description: 'Instalacion de puertas y ventanas', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', icon: 'Lock' },
    ]
  },
  {
    title: 'Servicios Generales',
    slug: 'servicios-generales',
    description: 'Limpieza, jardineria, mudanzas, mantenimiento y reparaciones del hogar.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    icon: 'Wrench',
    metadata: { color: '#0f7a5a', featured: true },
    sortOrder: 2,
    subcategories: [
      { title: 'Limpieza de Casas', slug: 'limpieza-casas', description: 'Limpieza general de hogares', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'SprayCan' },
      { title: 'Limpieza de Oficinas', slug: 'limpieza-oficinas', description: 'Limpieza de espacios comerciales', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Building2' },
      { title: 'Limpieza Profunda', slug: 'limpieza-profunda', description: 'Limpieza detallada e integral', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'SprayCan' },
      { title: 'Jardineria', slug: 'jardineria', description: 'Diseno y cuidado de jardines', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80', icon: 'Leaf' },
      { title: 'Paisajismo', slug: 'paisajismo', description: 'Diseno de paisajes', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80', icon: 'Leaf' },
      { title: 'Mantenimiento General', slug: 'mantenimiento-general', description: 'Reparaciones y mantenimiento del hogar', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: 'Wrench' },
      { title: 'Reparaciones Menores', slug: 'reparaciones-menores', description: 'Reparaciones domesticas en general', image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&q=80', icon: 'Tool' },
      { title: 'Mudanzas', slug: 'mudanzas', description: 'Traslados y mudanzas', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Fletes', slug: 'fletes', description: 'Fletes y transportes de carga', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
    ]
  },
  {
    title: '24-7',
    slug: '24-7',
    description: 'Profesionales disponibles 24 horas, 7 días a la semana.',
    image: 'https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=800&q=80',
    icon: 'AlertTriangle',
    metadata: { color: '#dc2626', featured: true, emergency: true },
    sortOrder: 3,
    subcategories: [
      { title: 'Medico a Domicilio', slug: 'medico-domicilio', description: 'Atencion medica a domicilio 24/7', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Enfermero/a', slug: 'enfermero', description: 'Cuidados de enfermeria a domicilio', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80', icon: 'Heart' },
      { title: 'Cuidador Adultos Mayores', slug: 'cuidador-mayores', description: 'Cuidado de adultos mayores', image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=80', icon: 'Users' },
      { title: 'Terapeuta', slug: 'terapeuta', description: 'Terapias fisicas y de recuperacion', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', icon: 'Heart' },
      { title: 'Psicologo de Urgencia', slug: 'psicologo-urgencia', description: 'Atencion psicologica de emergencia online', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Heart' },
      { title: 'Electricista Urgente', slug: 'electricista-urgente', description: 'Emergencias electricas 24/7', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: 'Zap' },
      { title: 'Plomero Urgente', slug: 'plomero-urgente', description: 'Emergencias de plomeria 24/7', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Droplets' },
      { title: 'Cerrajero Urgente', slug: 'cerrajero-urgente', description: 'Apertura y reparacion de cerraduras 24/7', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', icon: 'Lock' },
    ]
  },
  {
    title: 'Empresas y Equipos',
    slug: 'empresas',
    description: 'Empresas constructoras, cuadrillas, equipos de limpieza y servicios corporativos.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    icon: 'Briefcase',
    metadata: { color: '#1d4ed8', featured: true },
    sortOrder: 4,
    subcategories: [
      { title: 'Empresas de Construccion', slug: 'empresas-construccion', description: 'Empresas constructoras', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', icon: 'Building2' },
      { title: 'Cuadrillas de Albanileria', slug: 'cuadrillas', description: 'Equipos de obra', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Users' },
      { title: 'Equipos de Mantenimiento', slug: 'equipos-mantenimiento', description: 'Equipos para mantenimiento integral', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80', icon: 'Users' },
      { title: 'Empresas de Limpieza', slug: 'empresas-limpieza', description: 'Servicios profesionales de limpieza', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'SprayCan' },
      { title: 'Servicios Corporativos', slug: 'corporativos', description: 'Servicios para empresas', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', icon: 'Briefcase' },
      { title: 'Obras Grandes', slug: 'obras-grandes', description: 'Contratacion integral de obras', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', icon: 'Building2' },
    ]
  },
  {
    title: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Reparacion de PC, redes, camaras, soporte IT y desarrollo web.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    icon: 'Monitor',
    metadata: { color: '#7c3aed', featured: false },
    sortOrder: 5,
    subcategories: [
      { title: 'Reparacion de PC', slug: 'reparacion-pc', description: 'Reparacion de computadoras', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
      { title: 'Tecnico en Redes', slug: 'redes', description: 'Instalacion y configuracion de redes', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Wifi' },
      { title: 'Instalacion de Camaras', slug: 'camaras', description: 'Instalacion de camaras de seguridad', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Camera' },
      { title: 'Soporte IT', slug: 'soporte-it', description: 'Soporte tecnico para empresas', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
      { title: 'Desarrollo Web', slug: 'desarrollo-web', description: 'Creacion de sitios y aplicaciones web', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', icon: 'Code' },
      { title: 'Soporte Tecnico Remoto', slug: 'soporte-remoto', description: 'Asistencia tecnica a distancia', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
    ]
  },
  {
    title: 'Automotor',
    slug: 'automotor',
    description: 'Mecanicos, chapistas, electricistas del automotor y auxilio mecanico.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    icon: 'Car',
    metadata: { color: '#0891b2', featured: false },
    sortOrder: 6,
    subcategories: [
      { title: 'Mecanico', slug: 'mecanico', description: 'Reparacion y mantenimiento de vehiculos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Wrench' },
      { title: 'Electricista del Automotor', slug: 'electricista-auto', description: 'Sistema electrico de vehiculos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Zap' },
      { title: 'Chapista', slug: 'chapista', description: 'Reparacion de carroceria', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Hammer' },
      { title: 'Pintura de Autos', slug: 'pintura-autos', description: 'Pintura automotriz', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Paintbrush' },
      { title: 'Gomeria', slug: 'gomeria', description: 'Reparacion y cambio de neumaticos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'CircleDot' },
      { title: 'Auxilio Mecanico', slug: 'auxilio-mecanico', description: 'Asistencia en ruta 24/7', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Truck' },
    ]
  },
  {
    title: 'Hogar y Confort',
    slug: 'hogar',
    description: 'Aire acondicionado, calefaccion, domotica y reparacion de electrodomesticos.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    icon: 'Home',
    metadata: { color: '#d97706', featured: false },
    sortOrder: 7,
    subcategories: [
      { title: 'Aire Acondicionado', slug: 'aire-acondicionado', description: 'Instalacion y reparacion de AA', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Snowflake' },
      { title: 'Calefaccion', slug: 'calefaccion', description: 'Instalacion y mantenimiento de calefaccion', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Flame' },
      { title: 'Domotica Basica', slug: 'domotica', description: 'Automatizacion del hogar', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Monitor' },
      { title: 'Instalacion de Electrodomesticos', slug: 'instalacion-electro', description: 'Instalacion de artefactos del hogar', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Tool' },
      { title: 'Reparacion de Electrodomesticos', slug: 'reparacion-electro', description: 'Reparacion de artefactos del hogar', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Tool' },
    ]
  },
  {
    title: 'Mascotas',
    slug: 'mascotas',
    description: 'Veterinaria, peluqueria canina, paseadores y cuidado de mascotas.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    icon: 'Dog',
    metadata: { color: '#0891b2', featured: false },
    sortOrder: 8,
    subcategories: [
      { title: 'Veterinaria', slug: 'veterinaria', description: 'Atencion veterinaria a domicilio', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Peluqueria Canina', slug: 'peluqueria-canina', description: 'Corte y banio para perros', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80', icon: 'Scissors' },
      { title: 'Paseador de Perros', slug: 'paseador-perros', description: 'Paseos diarios para tu mascota', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80', icon: 'Dog' },
      { title: 'Guarderia de Mascotas', slug: 'guarderia-mascotas', description: 'Cuidado temporal de mascotas', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80', icon: 'Home' },
    ]
  },
  {
    title: 'Belleza y Cuidado',
    slug: 'belleza',
    description: 'Peluqueria, barberia, manicuria, maquillaje y mas.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    icon: 'Sparkles',
    metadata: { color: '#db2777', featured: false },
    sortOrder: 9,
    subcategories: [
      { title: 'Peluqueria', slug: 'peluqueria', description: 'Corte y peinado a domicilio', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', icon: 'Scissors' },
      { title: 'Barberia', slug: 'barberia', description: 'Corte de cabello y arreglo de barba', image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&q=80', icon: 'Scissors' },
      { title: 'Manicuria', slug: 'manicuria', description: 'Unas esculpidas y decoracion', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80', icon: 'Hand' },
      { title: 'Maquillaje', slug: 'maquillaje', description: 'Maquillaje profesional a domicilio', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', icon: 'Sparkles' },
      { title: 'Depilacion', slug: 'depilacion', description: 'Depilacion profesional', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', icon: 'Sparkles' },
      { title: 'Masajes', slug: 'masajes', description: 'Masajes relajantes y descontracturantes', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', icon: 'Heart' },
    ]
  },
  {
    title: 'Gastronomia',
    slug: 'gastronomia',
    description: 'Chef a domicilio, cocinero, parrillero, barman y catering.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    icon: 'ChefHat',
    metadata: { color: '#dc2626', featured: false },
    sortOrder: 10,
    subcategories: [
      { title: 'Chef a Domicilio', slug: 'chef-domicilio', description: 'Cocina profesional en tu hogar', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80', icon: 'ChefHat' },
      { title: 'Cocinero', slug: 'cocinero', description: 'Cocinero para eventos y hogar', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', icon: 'ChefHat' },
      { title: 'Parrillero', slug: 'parrillero', description: 'Asados y parrilla profesional', image: 'https://images.unsplash.com/photo-1558030106-2ba68f90d0f0?w=600&q=80', icon: 'Flame' },
      { title: 'Barman', slug: 'barman', description: 'Cocteleria y barra para eventos', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4a7f1b?w=600&q=80', icon: 'Wine' },
      { title: 'Catering', slug: 'catering', description: 'Servicio de catering para eventos', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', icon: 'ChefHat' },
    ]
  },
  {
    title: 'Transporte y Turismo',
    slug: 'transporte',
    description: 'Fletes, gruas, mecanico a domicilio, transporte turistico y remises.',
    image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=800&q=80',
    icon: 'Car',
    metadata: { color: '#2563eb', featured: false },
    sortOrder: 11,
    subcategories: [
      { title: 'Fletes y Mudanzas', slug: 'fletes-transporte', description: 'Fletes y mudanzas', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Servicio de Gruas', slug: 'gruas', description: 'Gruas para vehiculos 24/7', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Truck' },
      { title: 'Mecanico a Domicilio', slug: 'mecanico-domicilio', description: 'Reparacion mecanica donde estes', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Wrench' },
      { title: 'Transporte Turistico', slug: 'transporte-turistico', description: 'Traslados turisticos y excursiones', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80', icon: 'Car' },
      { title: 'Remises', slug: 'remises', description: 'Remises y traslados ejecutivos', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', icon: 'Car' },
    ]
  },
  {
    title: 'Cerrajeria',
    slug: 'cerrajeria',
    description: 'Cerrajeria del hogar, automotor y apertura de puertas.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    icon: 'Lock',
    metadata: { color: '#65a30d', featured: false },
    sortOrder: 12,
    subcategories: [
      { title: 'Cerrajeria del Hogar', slug: 'cerrajeria-hogar', description: 'Reparacion e instalacion de cerraduras', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', icon: 'Lock' },
      { title: 'Cerrajeria Automotor', slug: 'cerrajeria-auto', description: 'Apertura de vehiculos y llaves', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Car' },
      { title: 'Apertura de Puertas', slug: 'apertura-puertas', description: 'Apertura de puertas sin llave', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', icon: 'Lock' },
      { title: 'Cajas de Seguridad', slug: 'cajas-seguridad', description: 'Reparacion de cajas fuertes', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', icon: 'Shield' },
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const catData of categories) {
      const { subcategories, ...mainData } = catData;

      let parent = await Category.findOne({ slug: mainData.slug });
      if (parent) {
        console.log(`Category "${mainData.title}" already exists, updating...`);
        parent.set(mainData);
      } else {
        parent = new Category(mainData);
      }
      await parent.save();

      const subIds = [];
      for (const subData of subcategories) {
        let sub = await Category.findOne({ slug: subData.slug });
        if (sub) {
          console.log(`   Subcategory "${subData.title}" already exists, updating...`);
          sub.set({ ...subData, parentCategory: parent._id });
        } else {
          sub = new Category({ ...subData, parentCategory: parent._id });
        }
        await sub.save();
        subIds.push(sub._id);
      }

      parent.subcategories = subIds;
      parent.professionalCount = await mongoose.model('Professional').countDocuments({ categoryId: { $in: subIds } });
      await parent.save();

      console.log(`  ${mainData.title} — ${subIds.length} subcategorias, ${parent.professionalCount} profesionales`);
    }

    const totalCats = categories.length;
    console.log(`\nSeed completado: ${totalCats} categorias principales`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
