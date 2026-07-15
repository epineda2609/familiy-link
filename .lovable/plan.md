## Iteración M — Homogeneizar tarjetas de emergencias + reordenar home

### 1. Completar datos de todos los eventos activos
En `src/data/mock/disasters.ts` agregar `magnitude` (cuando aplique), `fatalities` y `missing` con valores ficticios pero realistas a los eventos existentes, manteniendo el evento de Yaracuy sin cambios:

- **Sismo Costa del Pacífico (MX, Guerrero, 2024-11-03)** — `magnitude: "6.8"`, `fatalities: 210`, `missing: 1450`.
- **Sismo Región de Valparaíso (CL, 2025-03-18)** — `magnitude: "6.4"`, `fatalities: 87`, `missing: 620`.
- **Enchentes do Rio Grande do Sul (BR, 2025-05-02)** — sin magnitud (es inundación), `fatalities: 540`, `missing: 3200`.
- **Desplazamiento frontera sur (VE, 2025-01-22)** — sin magnitud (es conflicto), `fatalities: 95`, `missing: 2100`.
- **Inundaciones del Río Cauca (CO, 2024-10-14, inactivo)** — `fatalities: 42`, `missing: 180` (aunque no se muestra en home por estar `active: false`, se completa por consistencia).

Los campos ya se renderizan condicionalmente en `src/routes/index.tsx`, por lo que ninguna tarjeta quedará vacía y todas mostrarán el mismo formato visual que Yaracuy.

### 2. Reposicionar "Nuestra misión" al final de la home
En `src/routes/index.tsx` mover el bloque `<section>` que contiene `mission.title` / `mission.originTitle` para que sea la última sección de `<main>`, justo antes de `<SiteFooter />` y después de la sección "Cómo funciona". El orden resultante será:

```text
Hero
Stats
Emergencias activas
Cómo funciona
Nuestra misión  ← movida aquí
Footer
```

No se cambia el contenido de la sección de misión, solo su posición en el JSX.

### Fuera de alcance
- Traducciones (no cambian claves i18n).
- Lógica de dominio o repositorios.
- Estilos de las tarjetas (ya soportan los campos).

### Archivos a editar
- `src/data/mock/disasters.ts`
- `src/routes/index.tsx`
