Implementar un filtro local por casos activos en la página Buscar personas, sin modificar componentes, layout, consultas ni filtros existentes.

### Cambios a realizar
1. En `src/routes/search.tsx`:
   - Añadir estado `activeOnly` inicializado a `true`.
   - Insertar un checkbox encima de la lista de resultados, debajo del encabezado de la sección, con el texto "Mostrar solo casos activos".
   - Checkbox marcado por defecto.
   - Filtrar el arreglo `results` antes de renderizar: si `activeOnly` es true, mostrar solo registros cuyo `status` sea `missing`, `searching` o `found`; ocultar `reunited`.
   - Si el checkbox se desmarca, renderizar todos los resultados.
   - El conteo de resultados debe reflejar la lista filtrada.
   - No modificar `SearchFilters`, `SearchForm`, `PeopleRepository` ni la consulta a Cloud.

2. Opcionalmente, añadir la clave `search.activeOnly` en `src/i18n/locales/es.ts` (y su contraparte en `en.ts` si aplica) para el texto del checkbox, manteniendo el idioma de la interfaz.

### Criterios de aceptación
- Al cargar `/search`, el checkbox aparece activado y los resultados solo incluyen estados activos.
- Desmarcar el checkbox muestra también los casos `reunited`.
- Los filtros y la búsqueda existentes siguen funcionando igual.
- Sin cambios de estilo, layout, colores ni texto de otros elementos.