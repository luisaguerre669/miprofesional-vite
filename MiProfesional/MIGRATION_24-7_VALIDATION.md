# Validación: Migración de Categoría "Emergencias" a "24-7"

## Estado de la Migración

Fecha: 22 de Mayo de 2026

### ✅ Cambios Completados

#### Backend
- ✅ **admin.js**: Categoría "24-7" con `metadata.emergency: true`
  - Archivo: `MiProfesional/backend/src/routes/admin.js` (línea 35)
  - Cambio: Agregado `emergency: true` a metadata
  
- ✅ **seed.js**: Ya contiene categoría "24-7" con configuración correcta
  - Archivo: `MiProfesional/backend/src/scripts/seed.js` (línea 59)
  - Slug: "24-7"
  - Metadata: `{ color: "#dc2626", featured: true, emergency: true }`
  
- ✅ **categories.js (rutas)**: Soporte para buscar por emergency flag
  - Método: `Category.findEmergency()`
  - Endpoint: `GET /api/v1/categories/emergency`

- ✅ **professionals.js (rutas)**: Parámetro de búsqueda disponibilidad
  - Parámetro: `disponibilidad` aceptado
  - Valores válidos: `"24-7"` o `"247"`
  - Lógica: Busca profesionales en categorías con `metadata.emergency: true`
  - Mensaje de fallback: "No hay profesionales disponibles 24-7 actualmente"

#### Frontend
- ✅ **Home.jsx**: Links actualizados a "24-7"
  - Línea 394: Link en navbar: `/search?disponibilidad=24-7`
  - Línea 801: Link en footer: `/search?disponibilidad=24-7`
  - Texto: "24-7" (en lugar de "Urgencias")

- ✅ **CategoryPage.jsx**: Badge "24-7" se muestra si `metadata.emergency = true`
  - Línea 79: Muestra badge "24-7" cuando corresponde
  - Línea 139: Muestra badge en hero

- ✅ **Search.jsx**: Soporte para filtrar por disponibilidad
  - Acepta parámetro `disponibilidad=24-7`

- ✅ **Sitemaps**: Actualizado
  - `frontend/public/sitemap.xml`: Cambio de `/categoria/emergencias` a `/categoria/24-7`

### 📋 Verificación de Consistencia

#### Base de Datos (Post-Migración)
```
Estructura esperada de la categoría "24-7":
{
  _id: ObjectId,
  title: "24-7",
  slug: "24-7",
  description: "Profesionales disponibles 24 horas, 7 días a la semana.",
  image: "https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=800&q=80",
  icon: "AlertTriangle",
  metadata: {
    color: "#dc2626",
    featured: true,
    emergency: true
  },
  isActive: true,
  sortOrder: 3
}
```

#### Sin Referencias Rotas
- ✅ No hay referencias a `/categoria/emergencias` en código fuente
- ✅ No hay referencias a slug "emergencias" en archivos principales
- ✅ Links en navbar y footer apuntan a `/search?disponibilidad=24-7`

### 🔄 Script de Migración Disponible

Archivo: `MiProfesional/backend/src/scripts/migrate-emergencias-to-24-7.js`

**Uso**:
```bash
cd MiProfesional/backend
node src/scripts/migrate-emergencias-to-24-7.js
```

**Qué hace**:
1. Conecta a MongoDB
2. Busca categoría con slug "emergencias"
3. Crea o actualiza categoría "24-7" con flag emergency
4. Migra profesionales de categoría antigua a nueva
5. Migra subcategorías
6. Elimina categoría antigua
7. Valida integridad de datos
8. Reporta resultados

### 🧪 Puntos de Validación

#### 1. Búsqueda de Profesionales 24-7
```javascript
// Debería retornar profesionales de categorías con emergency: true
GET /api/v1/professionals?disponibilidad=24-7
```

**Resultado esperado**:
- Status: 200
- Profesionales de categoría "24-7" (y subcategorías)
- Si no hay: `{ success: true, message: "No hay profesionales disponibles 24-7 actualmente", data: [] }`

#### 2. Página de Categoría
```
GET /categoria/24-7 (CategoryPage.jsx)
```

**Resultado esperado**:
- Carga correctamente la categoría
- Muestra profesionales de 24-7
- Badge "24-7" visible en hero

#### 3. Búsqueda General
```
GET /search?disponibilidad=24-7
```

**Resultado esperado**:
- Filtra profesionales correctamente
- Muestra solo profesionales de disponibilidad 24-7

#### 4. Página de Inicio
```
GET / (Home.jsx)
```

**Resultado esperado**:
- Links a `/search?disponibilidad=24-7` funcionan
- Navbar y footer muestran "24-7"
- No hay referencias a "Urgencias" o "emergencias"

### 🚀 Pasos Siguientes (Post-Implementación)

1. **Ejecutar Script de Migración**:
   ```bash
   cd MiProfesional/backend
   node src/scripts/migrate-emergencias-to-24-7.js
   ```

2. **Verificar en Base de Datos** (MongoDB):
   ```javascript
   // Verificar que no exista slug "emergencias"
   db.categories.find({ slug: "emergencias" })
   
   // Verificar que exista slug "24-7" con emergency: true
   db.categories.findOne({ slug: "24-7" })
   
   // Contar profesionales en categoría "24-7"
   db.professionals.countDocuments({ categoryId: ObjectId("...") })
   ```

3. **Pruebas Manuales**:
   - Navegar a `/categoria/24-7` y verificar que carga correctamente
   - Hacer clic en link "24-7" desde navbar/footer
   - Buscar `/search?disponibilidad=24-7` y verificar resultados
   - Verificar que no hay errores en console

4. **Actualizar Sitemaps Compilados** (si aplica):
   - `frontend/dist/sitemap.xml`
   - `frontend/android/app/src/main/assets/public/sitemap.xml`

### 📝 Resumen de Archivos Modificados

1. **Backend**:
   - ✏️ `MiProfesional/backend/src/routes/admin.js` - Agregado `emergency: true`
   - ➕ `MiProfesional/backend/src/scripts/migrate-emergencias-to-24-7.js` - Script de migración

2. **Frontend**:
   - ✅ `MiProfesional/frontend/src/pages/Home.jsx` - Ya actualizado
   - ✅ `MiProfesional/frontend/src/pages/CategoryPage.jsx` - Ya actualizado
   - ✅ `MiProfesional/frontend/src/pages/Search.jsx` - Ya actualizado

3. **Configuración**:
   - ✏️ `MiProfesional/frontend/public/sitemap.xml` - Actualizado slug

### ⚠️ Notas Importantes

- El parámetro de búsqueda es `disponibilidad=24-7` (no `category=24-7`)
- La categoría debe tener `metadata.emergency: true` para ser encontrada por el filtro
- El slug "24-7" es el identificador único en URLs
- Después de ejecutar la migración, verifica que no existan referencias residuales a "emergencias"

### 📊 Checklist Final

- [ ] Ejecutar script de migración en BD de producción
- [ ] Verificar en MongoDB que la migración fue exitosa
- [ ] Probar búsqueda por disponibilidad 24-7
- [ ] Probar navegación a `/categoria/24-7`
- [ ] Verificar que no hay errores en console
- [ ] Confirmar que el badge "24-7" aparece correctamente
- [ ] Actualizar sitemaps compilados (si aplica)
- [ ] Testear en mobile (APP y web)
