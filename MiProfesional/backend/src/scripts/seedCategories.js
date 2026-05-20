require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
require('../models/Professional');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

const categoriesData = [
  {
    title: 'Salud',
    slug: 'salud',
    description: 'Medicos clinicos, odontologos, psicologos, nutricionistas, kinesiologos y mas profesionales de la salud a domicilio o consulta.',
    image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=800&q=80',
    icon: 'Stethoscope',
    metadata: { color: '#0f7a5a', featured: true },
    sortOrder: 1,
    subcategories: [
      { title: 'Medico clinico', slug: 'medico-clinico', description: 'Atencion medica general a domicilio', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Odontologo', slug: 'odontologo', description: 'Atencion odontologica a domicilio', image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Psicologo', slug: 'psicologo', description: 'Atencion psicologica presencial y online', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', icon: 'Heart' },
      { title: 'Nutricionista', slug: 'nutricionista', description: 'Plan nutricional y acompanamiento alimenticio', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80', icon: 'Heart' },
      { title: 'Kinesiologo / Fisioterapeuta', slug: 'kinesiologo', description: 'Rehabilitacion y terapia fisica', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', icon: 'Heart' },
      { title: 'Ginecologo', slug: 'ginecologo', description: 'Atencion ginecologica a domicilio', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Pediatra', slug: 'pediatra', description: 'Atencion pediatrica a domicilio', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80', icon: 'Heart' },
      { title: 'Dermatologo', slug: 'dermatologo', description: 'Consulta dermatologica a domicilio', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Oftalmologo', slug: 'oftalmologo', description: 'Atencion oftalmologica a domicilio', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Cardiologo', slug: 'cardiologo', description: 'Consulta cardiologica a domicilio', image: 'https://images.unsplash.com/photo-1550837368-6594235de4c0?w=600&q=80', icon: 'Heart' },
      { title: 'Enfermero/a domiciliario', slug: 'enfermero-domiciliario', description: 'Cuidados de enfermeria a domicilio', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80', icon: 'Heart' },
      { title: 'Fonoaudiologo', slug: 'fonoaudiologo', description: 'Terapia del habla y lenguaje', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', icon: 'Heart' },
    ]
  },
  {
    title: 'Legal',
    slug: 'legal',
    description: 'Abogados especializados, escribanos y mediadores legales para asuntos civiles, laborales, penales, comerciales y de familia.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    icon: 'Scale',
    metadata: { color: '#1d4ed8', featured: true },
    sortOrder: 2,
    subcategories: [
      { title: 'Abogado civil', slug: 'abogado-civil', description: 'Asesoria en derecho civil y contractual', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Scale' },
      { title: 'Abogado laboral', slug: 'abogado-laboral', description: 'Derecho laboral e indemnizaciones', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Scale' },
      { title: 'Abogado penalista', slug: 'abogado-penal', description: 'Defensa penal y representacion legal', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Scale' },
      { title: 'Abogado comercial', slug: 'abogado-comercial', description: 'Derecho comercial y societario', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Briefcase' },
      { title: 'Abogado de familia', slug: 'abogado-familia', description: 'Divorcios, alimentos y regimen de visitas', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Users' },
      { title: 'Escribano', slug: 'escribano', description: 'Escrituras, poderes y certificaciones', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Scale' },
      { title: 'Mediador legal', slug: 'mediador-legal', description: 'Mediacion y resolucion de conflictos', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Users' },
    ]
  },
  {
    title: 'Construccion y Hogar',
    slug: 'construccion-y-hogar',
    description: 'Albaniles, plomeros, electricistas, gasistas, pintores, carpinteros, cerrajeros y todo oficio para tu hogar.',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80',
    icon: 'Building2',
    metadata: { color: '#b45309', featured: true },
    sortOrder: 3,
    subcategories: [
      { title: 'Albanil', slug: 'albanil', description: 'Construccion y reparacion de estructuras', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Hammer' },
      { title: 'Plomero', slug: 'plomero', description: 'Instalaciones hidraulicas y sanitarias', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Droplets' },
      { title: 'Electricista', slug: 'electricista', description: 'Instalacion y reparacion electrica', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: 'Zap' },
      { title: 'Gasista matriculado', slug: 'gasista', description: 'Instalacion y mantenimiento de gas', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Flame' },
      { title: 'Pintor', slug: 'pintor', description: 'Pintura interior y exterior', image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80', icon: 'Paintbrush' },
      { title: 'Yesero', slug: 'yesero', description: 'Revoques y placas de yeso', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Wrench' },
      { title: 'Carpintero', slug: 'carpintero', description: 'Muebles y trabajos en madera', image: 'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=600&q=80', icon: 'Hammer' },
      { title: 'Techista', slug: 'techista', description: 'Techos y cubiertas', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Building2' },
      { title: 'Pisos y revestimientos', slug: 'pisos-revestimientos', description: 'Instalacion de pisos y revestimientos', image: 'https://images.unsplash.com/photo-1574359411650-95473a0e1f2b?w=600&q=80', icon: 'Wrench' },
      { title: 'Cerrajero', slug: 'cerrajero', description: 'Reparacion e instalacion de cerraduras', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', icon: 'Lock' },
      { title: 'Herrero', slug: 'herrero', description: 'Estructuras metalicas y soldadura', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Hammer' },
      { title: 'Jardineria y paisajismo', slug: 'jardineria', description: 'Diseno y cuidado de jardines', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80', icon: 'Leaf' },
      { title: 'Piletas y piscinas', slug: 'piletas', description: 'Mantenimiento y reparacion de piscinas', image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80', icon: 'Droplets' },
      { title: 'Climatizacion (AA / calefaccion)', slug: 'climatizacion', description: 'Instalacion y reparacion de aire acondicionado y calefaccion', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Snowflake' },
    ]
  },
  {
    title: 'Hogar y Diseno',
    slug: 'hogar-diseno',
    description: 'Arquitectos, disenadores de interiores, decoradores, restauracion de muebles y mas para transformar tus espacios.',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    icon: 'Palette',
    metadata: { color: '#d97706', featured: false },
    sortOrder: 4,
    subcategories: [
      { title: 'Arquitecto', slug: 'arquitecto', description: 'Diseno y proyecto arquitectonico', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80', icon: 'Building2' },
      { title: 'Disenador de interiores', slug: 'disenador-interiores', description: 'Diseno yDecoracion de interiores', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80', icon: 'Palette' },
      { title: 'Decorador de interiores', slug: 'decorador', description: 'Asesoria y ejecucion decorativa', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80', icon: 'Palette' },
      { title: 'Restauracion de muebles', slug: 'restauracion-muebles', description: 'Restauracion y reciclado de muebles', image: 'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=600&q=80', icon: 'Hammer' },
      { title: 'Cortinas y tapiceria', slug: 'cortinas-tapiceria', description: 'Fabricacion y colocacion de cortinas y tapizados', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80', icon: 'Wrench' },
    ]
  },
  {
    title: 'Servicios Generales',
    slug: 'servicios-generales',
    description: 'Limpieza, mudanzas, fletes, tecnicos de electrodomesticos, costura, mantenimiento general y mas.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    icon: 'Wrench',
    metadata: { color: '#0f7a5a', featured: true },
    sortOrder: 5,
    subcategories: [
      { title: 'Limpieza profesional', slug: 'limpieza-profesional', description: 'Limpieza general de hogares y oficinas', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'SprayCan' },
      { title: 'Mudanzas', slug: 'mudanzas', description: 'Traslados y mudanzas', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Fletes', slug: 'fletes', description: 'Fletes y transporte de carga', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Tecnico de electrodomesticos', slug: 'tecnico-electrodomesticos', description: 'Reparacion de lavarropas, heladeras, cocinas y mas', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', icon: 'Wrench' },
      { title: 'Costura y sastreria', slug: 'costura-sastreria', description: 'Arreglos de ropa, sastreria a medida', image: 'https://images.unsplash.com/photo-1559548331-f9cb9803144e?w=600&q=80', icon: 'Scissors' },
      { title: 'Mantenimiento general', slug: 'mantenimiento-general', description: 'Reparaciones y mantenimiento integral', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', icon: 'Wrench' },
      { title: 'Control de plagas', slug: 'control-plagas', description: 'Fumigacion y control de plagas', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'SprayCan' },
    ]
  },
  {
    title: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Reparacion de PC y celulares, redes, desarrollo web, instalacion de camaras y soporte IT.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    icon: 'Monitor',
    metadata: { color: '#7c3aed', featured: false },
    sortOrder: 6,
    subcategories: [
      { title: 'Reparacion de PC', slug: 'reparacion-pc', description: 'Reparacion de computadoras y notebooks', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
      { title: 'Reparacion de celulares', slug: 'reparacion-celulares', description: 'Reparacion de smartphones y tablets', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', icon: 'Monitor' },
      { title: 'Redes e internet', slug: 'redes-internet', description: 'Instalacion y configuracion de redes wifi', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Wifi' },
      { title: 'Desarrollo web', slug: 'desarrollo-web', description: 'Creacion de sitios y aplicaciones web', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', icon: 'Code' },
      { title: 'Desarrollo de software', slug: 'desarrollo-software', description: 'Desarrollo de aplicaciones de escritorio y mobile', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', icon: 'Code' },
      { title: 'Instalacion de camaras', slug: 'instalacion-camaras', description: 'Instalacion de camaras de seguridad y videovigilancia', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Camera' },
      { title: 'Soporte tecnico remoto', slug: 'soporte-remoto', description: 'Asistencia tecnica a distancia', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
    ]
  },
  {
    title: 'Automotores',
    slug: 'automotores',
    description: 'Mecanicos, chapistas, electricistas del automotor, gomeros, lavaderos y auxilio mecanico.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    icon: 'Car',
    metadata: { color: '#0891b2', featured: false },
    sortOrder: 7,
    subcategories: [
      { title: 'Mecanico general', slug: 'mecanico-general', description: 'Reparacion y mantenimiento de vehiculos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Wrench' },
      { title: 'Electricista automotriz', slug: 'electricista-automotriz', description: 'Sistema electrico de vehiculos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Zap' },
      { title: 'Chapista', slug: 'chapista', description: 'Reparacion de carroceria y chapa', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Hammer' },
      { title: 'Pintura automotriz', slug: 'pintura-automotriz', description: 'Pintura de autos y detalles', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Paintbrush' },
      { title: 'Gomeria', slug: 'gomeria', description: 'Reparacion y cambio de neumaticos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'CircleDot' },
      { title: 'Lava autos', slug: 'lava-autos', description: 'Lavado y detallado de vehiculos', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Droplets' },
      { title: 'Auxilio mecanico / grua', slug: 'auxilio-mecanico', description: 'Asistencia en ruta y servicio de grua 24/7', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Truck' },
    ]
  },
  {
    title: 'Mascotas',
    slug: 'mascotas',
    description: 'Veterinarios, peluqueros caninos, paseadores, cuidado de mascotas y adiestramiento.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    icon: 'Dog',
    metadata: { color: '#059669', featured: false },
    sortOrder: 8,
    subcategories: [
      { title: 'Veterinario', slug: 'veterinario', description: 'Atencion veterinaria a domicilio', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Peluqueria canina', slug: 'peluqueria-canina', description: 'Corte y bano para mascotas', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80', icon: 'Scissors' },
      { title: 'Paseador de perros', slug: 'paseador-perros', description: 'Paseos diarios para tu mascota', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80', icon: 'Dog' },
      { title: 'Cuidado de mascotas (pet sitting)', slug: 'pet-sitting', description: 'Cuidado de mascotas en tu hogar', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80', icon: 'Dog' },
      { title: 'Adiestramiento canino', slug: 'adiestramiento-canino', description: 'Entrenamiento y educacion canina', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80', icon: 'Dog' },
      { title: 'Guarderia de mascotas', slug: 'guarderia-mascotas', description: 'Cuidado temporal de mascotas', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80', icon: 'Home' },
    ]
  },
  {
    title: 'Transporte',
    slug: 'transporte',
    description: 'Taxis, remises, transporte escolar, ejecutivo, mensajeria y cadeteria.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    icon: 'Bus',
    metadata: { color: '#2563eb', featured: false },
    sortOrder: 9,
    subcategories: [
      { title: 'Taxi y remis', slug: 'taxi-remis', description: 'Viajes urbanos e interurbanos', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', icon: 'Car' },
      { title: 'Transporte escolar', slug: 'transporte-escolar', description: 'Traslado escolar diario', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80', icon: 'Bus' },
      { title: 'Transporte ejecutivo', slug: 'transporte-ejecutivo', description: 'Traslados corporativos y ejecutivos', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', icon: 'Car' },
      { title: 'Mensajeria y cadeteria', slug: 'mensajeria-cadeteria', description: 'Envios y mensajeria urbana', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Transporte de carga', slug: 'transporte-carga', description: 'Transporte de mercaderia y bultos', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=80', icon: 'Truck' },
      { title: 'Transporte turistico', slug: 'transporte-turistico', description: 'Excursiones y traslados turisticos', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80', icon: 'Bus' },
    ]
  },
  {
    title: 'Eventos',
    slug: 'eventos',
    description: 'Catering, fotografos, musica y DJ, organizadores de eventos, alquiler de equipos y animacion.',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
    icon: 'Calendar',
    metadata: { color: '#dc2626', featured: false },
    sortOrder: 10,
    subcategories: [
      { title: 'Catering y servicio de comidas', slug: 'catering', description: 'Servicio de catering para eventos', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80', icon: 'ChefHat' },
      { title: 'Fotografo', slug: 'fotografo', description: 'Fotografia profesional de eventos', image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&q=80', icon: 'Camera' },
      { title: 'Musica y DJ', slug: 'musica-dj', description: 'Musica en vivo y DJ para eventos', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', icon: 'Music4' },
      { title: 'Organizador de eventos', slug: 'organizador-eventos', description: 'Planificacion y coordinacion integral', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', icon: 'Calendar' },
      { title: 'Alquiler de equipos y mobiliario', slug: 'alquiler-equipos', description: 'Alquiler de mesas, sillas, carpas y equipos', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', icon: 'Wrench' },
      { title: 'Decoracion de eventos', slug: 'decoracion-eventos', description: 'Diseno y montaje decorativo', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', icon: 'Palette' },
      { title: 'Animacion y entretenimiento', slug: 'animacion-eventos', description: 'Animadores, shows y entretenimiento', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', icon: 'Music4' },
      { title: 'Sonido e iluminacion', slug: 'sonido-iluminacion', description: 'Equipos de sonido e iluminacion profesional', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', icon: 'Music4' },
    ]
  },
  {
    title: 'Educacion',
    slug: 'educacion',
    description: 'Profesores particulares, idiomas, apoyo escolar, deportes, musica, talleres artisticos y capacitacion profesional.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    icon: 'GraduationCap',
    metadata: { color: '#0891b2', featured: false },
    sortOrder: 11,
    subcategories: [
      { title: 'Profesor particular', slug: 'profesor-particular', description: 'Clases particulares de todas las materias', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'BookOpen' },
      { title: 'Idiomas', slug: 'idiomas', description: 'Clases de ingles, portugues y otros idiomas', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'BookOpen' },
      { title: 'Apoyo escolar', slug: 'apoyo-escolar', description: 'Apoyo en tareas y nivelacion escolar', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'BookOpen' },
      { title: 'Deportes y actividad fisica', slug: 'deportes', description: 'Entrenadores personales y profesores de deportes', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', icon: 'Heart' },
      { title: 'Talleres artisticos', slug: 'talleres-artisticos', description: 'Pintura, ceramica, teatro y expresion artistica', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80', icon: 'Palette' },
      { title: 'Capacitacion profesional', slug: 'capacitacion-profesional', description: 'Cursos y formacion para profesionales', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'GraduationCap' },
      { title: 'Musica e instrumentos', slug: 'musica', description: 'Clases de guitarra, piano, canto e instrumentos', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80', icon: 'Music4' },
      { title: 'Clases online', slug: 'clases-online', description: 'Clases virtuales de todas las disciplinas', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'Monitor' },
    ]
  },
  {
    title: 'Profesionales',
    slug: 'profesionales',
    description: 'Contadores, consultores, administradores de consorcio, seguros, marketing y recursos humanos.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    icon: 'Briefcase',
    metadata: { color: '#1d4ed8', featured: true },
    sortOrder: 12,
    subcategories: [
      { title: 'Contador', slug: 'contador', description: 'Contabilidad, impuestos y balances', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Briefcase' },
      { title: 'Consultor empresarial', slug: 'consultor-empresarial', description: 'Consultoria estrategica y de negocios', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Briefcase' },
      { title: 'Administrador de consorcio', slug: 'administrador-consorcio', description: 'Administracion de edificios y consorcios', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Building2' },
      { title: 'Seguros', slug: 'seguros', description: 'Asesoria y contratacion de seguros', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Shield' },
      { title: 'Marketing y publicidad', slug: 'marketing-publicidad', description: 'Estrategias de marketing y publicidad', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Megaphone' },
      { title: 'Recursos humanos', slug: 'recursos-humanos', description: 'Seleccion de personal y consultoria RH', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Users' },
    ]
  },
  {
    title: 'Seguridad',
    slug: 'seguridad',
    description: 'Vigilancia privada, alarmas y monitoreo, seguridad electronica y proteccion personal.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    icon: 'Shield',
    metadata: { color: '#374151', featured: false },
    sortOrder: 13,
    subcategories: [
      { title: 'Vigilancia privada', slug: 'vigilancia-privada', description: 'Servicio de vigilancia y seguridad fisica', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Shield' },
      { title: 'Alarmas y monitoreo', slug: 'alarmas-monitoreo', description: 'Instalacion y monitoreo de alarmas', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Shield' },
      { title: 'Seguridad electronica', slug: 'seguridad-electronica', description: 'Sistemas electronicos de seguridad', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Monitor' },
      { title: 'Seguridad personal', slug: 'seguridad-personal', description: 'Proteccion personal y escolta', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Shield' },
      { title: 'Proteccion contra incendios', slug: 'proteccion-incendios', description: 'Instalacion y mantenimiento de sistemas contra incendios', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', icon: 'Flame' },
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Professional = mongoose.model('Professional');
    let totalSubs = 0;

    for (const catData of categoriesData) {
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
      parent.professionalCount = await Professional.countDocuments({ categoryId: { $in: subIds } });
      await parent.save();

      console.log(`  ${mainData.title} (${mainData.slug}) — ${subIds.length} subcategorias, ${parent.professionalCount} profesionales`);
      totalSubs += subIds.length;
    }

    console.log(`\nSeed completado: ${categoriesData.length} categorias principales, ${totalSubs} subcategorias`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
