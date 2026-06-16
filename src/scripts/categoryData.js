const categoriesData = [
  {
    title: 'Profesionales',
    slug: 'profesionales',
    description: 'Médicos, psicólogos, abogados, contadores, plomeros, electricistas, peluqueros y todos los profesionales de servicio.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
    icon: 'Briefcase',
    metadata: { color: '#0f7a5a', featured: true, primaryCategory: 'professional' },
    sortOrder: 1,
    subcategories: [
      { title: 'Salud', slug: 'prof-salud', description: 'Medicos, psicologos, kinesiologos, dentistas, enfermeros', image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&q=80', icon: 'Stethoscope' },
      { title: 'Construcción y Hogar', slug: 'prof-construccion', description: 'Albañiles, plomeros, electricistas, pintores, carpinteros', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80', icon: 'Building2' },
      { title: 'Legales y Administración', slug: 'prof-legales', description: 'Abogados, contadores, escribanos, gestores', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80', icon: 'Scale' },
      { title: 'Belleza y Cuidado', slug: 'prof-belleza', description: 'Peluquería, manicuría, masajes, barbería, maquillaje', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80', icon: 'Sparkles' },
      { title: 'Tecnología', slug: 'prof-tecnologia', description: 'Reparación de PC/celulares, desarrollo web, soporte IT', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80', icon: 'Monitor' },
      { title: 'Automotores', slug: 'prof-automotores', description: 'Mecánicos, electricistas del automotor, gomeros, chapistas', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80', icon: 'Car' },
      { title: 'Educación', slug: 'prof-educacion', description: 'Profesores particulares, idiomas, apoyo escolar, música', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'GraduationCap' },
      { title: 'Eventos', slug: 'prof-eventos', description: 'Fotógrafos, catering, DJ, organización de eventos', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80', icon: 'Calendar' },
      { title: 'Bienestar y Deportes', slug: 'prof-bienestar', description: 'Personal trainer, yoga, pilates, gimnasios', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', icon: 'Dumbbell' },
      { title: 'Mascotas (servicios)', slug: 'prof-mascotas', description: 'Peluquería canina, paseadores, guardería, adiestramiento', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80', icon: 'Dog' },
      { title: 'Transporte', slug: 'prof-transporte', description: 'Taxis, remises, transporte escolar, mensajería', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', icon: 'Car' },
      { title: 'Servicios Generales', slug: 'prof-servicios', description: 'Limpieza, mudanzas, fletes, técnicos, mantenimiento', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80', icon: 'Wrench' },
    ]
  },
  {
    title: 'Empresas',
    slug: 'empresas',
    description: 'Consultoras, capacitación corporativa, outsourcing, servicios B2B, desarrollo de software empresarial.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    icon: 'Building2',
    metadata: { color: '#1d4ed8', featured: true, primaryCategory: 'empresa' },
    sortOrder: 2,
    subcategories: [
      { title: 'Consultoría empresarial', slug: 'emp-consultoria', description: 'Consultoría estratégica, financiera y de gestión', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Briefcase' },
      { title: 'Capacitación corporativa', slug: 'emp-capacitacion', description: 'Cursos, talleres y formación para empresas', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', icon: 'GraduationCap' },
      { title: 'Desarrollo de software', slug: 'emp-software', description: 'Soluciones de software a medida para empresas', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', icon: 'Code' },
      { title: 'Marketing y publicidad', slug: 'emp-marketing', description: 'Agencias de marketing, SEO, redes sociales', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', icon: 'Megaphone' },
      { title: 'Recursos humanos', slug: 'emp-rrhh', description: 'Selección de personal, búsquedas ejecutivas', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Users' },
      { title: 'Outsourcing y servicios B2B', slug: 'emp-outsourcing', description: 'Tercerización de servicios empresariales', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', icon: 'Building2' },
      { title: 'Seguros empresariales', slug: 'emp-seguros', description: 'Seguros corporativos y de responsabilidad civil', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80', icon: 'Shield' },
    ]
  },
  {
    title: 'Comercio',
    slug: 'comercio',
    description: 'Farmacias, kioscos, panaderías, ferreterías, almacenes, tiendas y todo tipo de comercios minoristas, mayoristas o mixtos.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    icon: 'Store',
    metadata: { color: '#059669', featured: true, primaryCategory: 'comercio' },
    sortOrder: 3,
    commerceTypes: ['minorista', 'mayorista', 'mixto'],
    commerceSubcategories: {
      minorista: [
        { title: 'Farmacia', slug: 'com-farmacia', description: 'Farmacias, perfumerías y productos de cuidado personal', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&q=85', icon: 'Heart' },
        { title: 'Óptica', slug: 'com-optica', description: 'Ópticas y centros ópticos', image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=85', icon: 'Eye' },
        { title: 'Kiosco', slug: 'com-kiosco', description: 'Kioscos, maxikioscos y golosinas', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=85', icon: 'Store' },
        { title: 'Rotisería', slug: 'com-rotiseria', description: 'Rotiserías, comidas preparadas y take away', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=85', icon: 'ChefHat' },
        { title: 'Tienda', slug: 'com-tienda', description: 'Tiendas de ropa, accesorios y artículos en general', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=85', icon: 'Shirt' },
        { title: 'Perfumería', slug: 'com-perfumeria', description: 'Perfumes, cosméticos y productos de belleza', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=85', icon: 'Sparkles' },
        { title: 'Almacén', slug: 'com-almacen', description: 'Almacenes de barrio y comercios de cercanía', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=85', icon: 'Store' },
        { title: 'Panadería', slug: 'com-panaderia', description: 'Pan artesanal, facturas y panificados', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=85', icon: 'ChefHat' },
        { title: 'Carnicería', slug: 'com-carniceria', description: 'Carnes vacunas, porcinas y avícolas', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=85', icon: 'Store' },
        { title: 'Verdulería', slug: 'com-verduleria', description: 'Frutas, verduras y productos de granja', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=85', icon: 'Apple' },
        { title: 'Heladería', slug: 'com-heladeria', description: 'Helados artesanales y postres helados', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=85', icon: 'Snowflake' },
        { title: 'Librería', slug: 'com-libreria', description: 'Librerías, papelería y artículos de oficina', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=85', icon: 'BookOpen' },
        { title: 'Juguetería', slug: 'com-jugueteria', description: 'Juguetes, juegos y artículos infantiles', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&q=85', icon: 'ToyBrick' },
        { title: 'Ferretería', slug: 'com-ferreteria', description: 'Ferreterías y artículos para el hogar', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=85', icon: 'Wrench' },
        { title: 'Bazar', slug: 'com-bazar', description: 'Artículos para el hogar, cocina y bazar', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=85', icon: 'Store' },
        { title: 'Mueblería', slug: 'com-muebleria', description: 'Muebles, colchones y decoración', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=85', icon: 'Home' },
        { title: 'Electrodomésticos', slug: 'com-electro', description: 'Venta de electrodomésticos y electrónicos', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=85', icon: 'Monitor' },
      ],
      mayorista: [
        { title: 'Alimentos por mayor', slug: 'com-alimentos-mayorista', description: 'Venta mayorista de alimentos y bebidas', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=85', icon: 'Store' },
        { title: 'Bebidas por mayor', slug: 'com-bebidas-mayorista', description: 'Distribución mayorista de bebidas', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=85', icon: 'Wine' },
        { title: 'Distribuidora', slug: 'com-distribuidora', description: 'Distribución de productos varios', image: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=600&q=85', icon: 'Truck' },
        { title: 'Limpieza industrial', slug: 'com-limpieza-industrial', description: 'Productos de limpieza para empresas e industrias', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=85', icon: 'SprayCan' },
      ],
      mixto: [
        { title: 'Almacén/Supermercado', slug: 'com-mixto-almacen', description: 'Almacenes y supermercados con venta minorista y mayorista', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=85', icon: 'Store' },
        { title: 'Tienda multiplataforma', slug: 'com-mixto-tienda', description: 'Tienda física con canal mayorista online', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=85', icon: 'Shirt' },
        { title: 'Depósito/comercio dual', slug: 'com-mixto-dual', description: 'Comercio con depósito y venta al público + por volumen', image: 'https://images.unsplash.com/photo-1553413077-190dd3058711?w=600&q=85', icon: 'Building2' },
      ]
    },
    tags: ['24hs', 'local fisico', 'atencion al publico', 'venta por volumen'],
  }
];

module.exports = categoriesData;
