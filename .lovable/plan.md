# Iteración J — Internacionalización completa + Narrativa humanitaria

BASUF se abre al mundo: 10 idiomas completos con soporte RTL, y una narrativa que conecta con el origen humanitario del proyecto (los dos hermanos, los sismos de Venezuela de junio 2026).

## Objetivos

1. Convertir BASUF en una plataforma verdaderamente multilingüe (10 idiomas completos).
2. Añadir soporte RTL para árabe con layouts tolerantes.
3. Elevar la home con un mensaje humanitario claro: contexto de origen + sección "Nuestra misión".
4. Mantener el tono humano, serio y esperanzador — nada de dashboard frío.

---

## Fase 1 — Refactor de arquitectura i18n

Actualmente `src/i18n/messages.ts` contiene un único archivo con dos objetos (`es`, `pt`). No escala a 10 idiomas.

**Cambios:**
- Nueva estructura `src/i18n/locales/{es,en,pt,fr,ar,da,it,de,tr,ja}.ts` — un archivo por idioma, mismo shape tipado.
- `src/i18n/messages.ts` pasa a ser el índice: importa los 10 locales, exporta el tipo `MessageKey` derivado del locale base (`es`) para garantizar type-safety.
- `Locale` type se expande a los 10 códigos ISO.
- `LocaleProvider` detecta idioma inicial en este orden: `localStorage` → `navigator.language` → `es`.
- Sincroniza `document.documentElement.lang` y `document.documentElement.dir` (`rtl` solo para `ar`, `ltr` para el resto).

## Fase 2 — Traducciones completas (10 idiomas)

Traducir cada clave existente + las nuevas de la Fase 4 a los 10 idiomas: **es, en, pt, fr, ar, da (danés), it, de, tr, ja**.

- Traducción humana y contextual, no literal — respetando el tono humanitario.
- Árabe con dirección RTL y numerales occidentales.
- Japonés respetando registro formal humanitario (敬語 cuando corresponda).
- Textos operativos (estados, roles, acciones) cortos y claros para lectores no técnicos.

## Fase 3 — Selector de idioma accesible

Reemplazar el toggle actual ES/PT por un selector real:

- Nuevo componente `LanguageSelector` en `src/components/LanguageSelector.tsx`.
- Menú desplegable accesible (`role="listbox"`, teclado, `aria-expanded`).
- Muestra bandera + nombre del idioma en su propio idioma (ej. `Français`, `العربية`, `日本語`).
- Presente en `SiteHeader` (desktop y menú móvil) — visible siempre.
- Guarda selección en `localStorage`.

## Fase 4 — Soporte RTL y layouts tolerantes

- `src/styles.css`: reglas globales para RTL (`[dir="rtl"]`) con márgenes/espaciados lógicos donde aplique.
- Reemplazar clases `ml-*/mr-*` por `ms-*/me-*` (Tailwind v4 soporta propiedades lógicas nativas) en componentes de layout compartido: `SiteHeader`, `SiteFooter`, `PersonCard`, `EmptyState`, `Toast`.
- Auditar textos largos: `SiteHeader`, tarjetas y navegación de pestañas institucionales usan `truncate` o `flex-wrap` para tolerar alemán / francés (que suelen ser 30-40% más largos).

## Fase 5 — Narrativa humanitaria en la home

**5.1 Hero mejorado** (`src/routes/index.tsx`)
- Sobre el H1 actual, un pequeño kicker/eyebrow: "Plataforma humanitaria de reunificación familiar".
- Bajo el H1, un párrafo contextual (1-2 líneas) con la línea de origen del proyecto — visible pero respetuoso, no dramático.
- Botones CTA principales conservan su lugar y jerarquía.

**5.2 Nueva sección "Nuestra misión"** (misma ruta `/`, bajo el hero y antes de los cards de acción)
- Tres pilares visuales (icono + título + descripción corta):
  - **Humanidad** — cada ficha es una persona, no un registro.
  - **Trazabilidad** — evidencia clara del origen y confiabilidad de cada dato.
  - **Esperanza** — un puente entre el caos y la reunificación.
- Un bloque narrativo corto (2-3 líneas) que introduce el origen: los dos hermanos, la necesidad urgente evidenciada tras los sismos de Venezuela del 24 de junio de 2026, y el propósito futuro (ONG, hospitales, refugios, brigadas).
- Todo el texto vive en las claves i18n `mission.*` — traducible a los 10 idiomas.
- Mantenemos las cards de acciones (`/search`, `/report`, `/institutional`) donde están hoy — no las tocamos.

## Fase 6 — Verificación

- `tsgo` para asegurar type-safety del refactor i18n.
- Recorrido visual: rutas `/`, `/search`, `/institutional` en `es`, `en`, `ar` (RTL) y `de` (textos largos).
- Confirmar que el `<html lang>` y `<html dir>` cambian correctamente.

---

## Detalles técnicos

**Estructura final de i18n:**
```text
src/i18n/
  locales/
    es.ts      ← locale base, define el shape (source of truth para MessageKey)
    en.ts
    pt.ts
    fr.ts
    ar.ts
    da.ts
    it.ts
    de.ts
    tr.ts
    ja.ts
  messages.ts  ← re-exporta { messages, Locale, MessageKey, localeMeta }
  LocaleProvider.tsx  ← detección + dir/lang sync + selector API
```

**`localeMeta`** contiene por idioma: `code`, `nativeName`, `flag` (emoji), `dir` (`ltr`|`rtl`) — consumido por `LanguageSelector`.

**Claves i18n nuevas (Fase 5):**
`hero.kicker`, `hero.contextLine`, `mission.title`, `mission.pillar.humanity.*`, `mission.pillar.traceability.*`, `mission.pillar.hope.*`, `mission.originTitle`, `mission.originBody`.

**Fuera de alcance en esta iteración:**
- Página `/about` dedicada (puede venir en Iteración K si se desea).
- Traducir logs de auditoría históricos ya almacenados en `localStorage` (solo se traducen los nuevos y la UI que los muestra).
- Fuentes específicas por script (árabe/japonés usan la fuente del sistema como fallback; podemos añadir web fonts dedicadas después si se pide).

## Resumen

Al terminar la iteración J, BASUF podrá usarse en 10 idiomas incluyendo árabe (RTL), tendrá un selector de idioma accesible y visible, y la home comunicará con claridad su origen humanitario y su misión — sin perder el orden y la seriedad ya construidos.