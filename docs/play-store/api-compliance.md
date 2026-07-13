# Revisión legal y de uso de APIs externas

Análisis para publicación en Google Play — **Clima multiciudad** (julio 2026).

---

## Resumen

| Servicio | Uso en la app | Uso comercial / Play Store | Acción recomendada |
|---|---|---|---|
| **Open-Meteo** | Pronóstico, geocodificación directa | Gratis **no comercial** por defecto | OK para lanzamiento sin monetización; revisar si crece tráfico |
| **Nominatim (OSM)** | Geocodificación inversa GPS → ciudad | Uso público con límites estrictos | OK con User-Agent identificado; no abusar de frecuencia |

**Conclusión:** Publicar en Play Store **gratis y sin anuncios** es coherente con los términos actuales. Si añades anuncios, suscripciones o uso masivo, revisa de nuevo.

---

## Open-Meteo

**URL:** https://open-meteo.com/  
**Términos:** https://open-meteo.com/en/terms

### Qué envía la app

- Coordenadas (lat/lon) de ubicación GPS o ciudades guardadas
- Sin API key, sin identificador de usuario

### Uso permitido (resumen)

- Uso **no comercial** gratuito con límites razonables de peticiones
- Atribución recomendada (en la app ya se menciona en privacidad / README)
- Para uso **comercial** o alto volumen: contactar Open-Meteo o contratar plan

### Riesgos

| Riesgo | Mitigación en la app |
|---|---|
| Demasiadas peticiones por usuario | Caché local, refresh manual + intervalo configurable (15–60 min) |
| Caída del servicio | Mensajes de error; datos en caché offline |
| Cambio de términos | Monitorizar https://open-meteo.com/en/terms |

### Recomendación Play Store

✅ **Aceptable** para v1.0 gratuita. En la ficha indica “Datos meteorológicos de terceros (Open-Meteo)”.

---

## Nominatim / OpenStreetMap

**URL:** https://nominatim.openstreetmap.org/  
**Política:** https://operations.osmfoundation.org/policies/nominatim/

### Qué envía la app

- Coordenadas GPS para obtener nombre de ciudad/región
- `User-Agent: Clima-app/1.0 (weather-app)` — **requerido por la política** ✓

### Reglas importantes

| Regla | Cumplimiento |
|---|---|
| Identificar la aplicación (User-Agent) | ✓ Implementado en `services/weather.ts` |
| Máx. ~1 petición/segundo | ✓ Solo al refrescar ubicación GPS, no en bucle |
| No usar como servicio masivo / geocoder comercial | ✓ Uso ligero por usuario |
| Atribución OSM | Incluir en privacidad (hecho) |

### Alternativa si crece el tráfico

- Geocodificación propia con datos OSM
- Servicio comercial (Mapbox, Google Geocoding, etc.)
- Volver a cachear nombres de ciudad más tiempo en dispositivo

### Recomendación Play Store

✅ **Aceptable** para lanzamiento con volumen bajo/medio.

---

## Permisos Android y declaración en Play

| Permiso | Justificación en ficha Play |
|---|---|
| `INTERNET` | Obtener pronóstico y geocodificación |
| `ACCESS_FINE_LOCATION` | Mostrar tiempo de tu ubicación (opcional) |
| `ACCESS_COARSE_LOCATION` | Igual, precisión aproximada |

En Play Console → **Permisos de la app**, declarar que la ubicación es **opcional** y central para la función “Mi ubicación”.

---

## Checklist legal antes de publicar

- [x] Política de privacidad pública con Open-Meteo y Nominatim
- [x] Seguridad de los datos alineada con la privacidad
- [ ] Sin monetización en v1.0 (o contratar planes API si la hay)
- [ ] Email de contacto válido en Play Console
- [ ] Revisar términos Open-Meteo si añades anuncios o versión de pago

---

## Cuándo volver a revisar

- Más de ~10 000 usuarios activos
- Anuncios, suscripciones o compras in-app
- Cambio a backend propio que reenvíe datos
- Nuevos proveedores de datos (radar, alertas, etc.)
