# Google Play — Seguridad de los datos

Respuestas para Play Console → **Seguridad de los datos**. Deben coincidir con la [política de privacidad](../privacy-policy.html).

---

## ¿Tu app recoge o comparte datos de usuario?

**Sí**, recoge datos (ubicación y preferencias locales). **No** los vende ni los usa para publicidad.

---

## Tipos de datos

### Ubicación

| Pregunta | Respuesta |
|---|---|
| ¿Se recogen? | **Sí** |
| ¿Obligatorio o opcional? | **Opcional** (solo si el usuario concede permiso GPS) |
| ¿Para qué? | **Funcionalidad de la app** (mostrar tiempo de la ubicación actual) |
| ¿Se comparten con terceros? | **Sí** — coordenadas enviadas a proveedores meteorológicos/geocodificación (ver abajo) |
| ¿Se procesan de forma efímera? | **No** — las coordenadas se envían en la petición; no se almacenan en servidores del desarrollador |
| ¿El usuario puede solicitar eliminación? | **Sí** — desinstalar app o borrar datos de la app en Ajustes de Android |

**Terceros que reciben ubicación (coordenadas):**
- Open-Meteo (pronóstico del tiempo)
- Nominatim / OpenStreetMap (nombre de ciudad a partir de coordenadas GPS)

### Información de la app / Otra información de rendimiento

| Pregunta | Respuesta |
|---|---|
| ¿Se recogen? | **Sí** (preferencias en el dispositivo) |
| Datos | Ciudades guardadas, orden, visibilidad, tipo de gráfica por recuadro, configuración de widgets |
| ¿Dónde se guardan? | **Solo en el dispositivo** (AsyncStorage) |
| ¿Se comparten? | **No** |
| ¿Para qué? | **Funcionalidad de la app** |

### Identificadores / Información personal

| Pregunta | Respuesta |
|---|---|
| ¿Se recogen? | **No** |
| Cuentas de usuario | **No** |
| ID de publicidad | **No** |

### Datos financieros, salud, mensajes, fotos, etc.

**No se recogen.**

---

## Prácticas de seguridad

| Pregunta | Respuesta |
|---|---|
| ¿Los datos se cifran en tránsito? | **Sí** (HTTPS a Open-Meteo y Nominatim) |
| ¿El usuario puede pedir eliminación? | **Sí** (desinstalar / borrar datos de la app) |
| ¿Cumples la política de Familias de Google Play? | **Sí** (app sin contenido restringido; sin anuncios; sin compras) |

---

## Declaración resumida (texto público en la ficha)

> La app puede usar tu ubicación si lo permites, solo para mostrar el tiempo de tu zona. Las coordenadas se envían a servicios meteorológicos (Open-Meteo) y de geocodificación (OpenStreetMap/Nominatim). Tus ciudades y ajustes se guardan en el teléfono. No hay cuentas, anuncios ni venta de datos.

---

## Checklist antes de publicar

- [ ] URL de privacidad activa y accesible
- [ ] Texto de la ficha coherente con estas respuestas
- [ ] Permiso de ubicación justificado en la ficha de permisos de Android
