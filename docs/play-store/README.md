# Publicación en Google Play — materiales listos

## URL pública de privacidad (punto 5)

Tras activar **GitHub Pages** en el repositorio:

1. GitHub → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/docs**
4. Guardar

URL para Play Console:

```
https://ernestocorral-lab.github.io/Clima-app/privacy-policy.html
```

Comprueba que abre en el navegador antes de pegarla en Play Console.

---

## Contenido de esta carpeta

| Archivo | Punto | Uso |
|---|---|---|
| [listing.md](./listing.md) | 4 | Títulos y descripciones ES/EN |
| [data-safety.md](./data-safety.md) | 6 | Respuestas formulario Seguridad de los datos |
| [content-rating.md](./content-rating.md) | 7 | Respuestas cuestionario IARC |
| [api-compliance.md](./api-compliance.md) | 8 | Revisión legal Open-Meteo + Nominatim |
| `icon-512.png` | 4 | Icono Play Store |
| `feature-graphic-1024x500.png` | 4 | Gráfico destacado |
| `screenshots/` | 4 | Capturas de pantalla |

Regenerar gráficos:

```bash
node scripts/generate-play-store-assets.mjs
```

---

## Orden sugerido en Play Console

1. Ficha de la tienda → textos de `listing.md` + subir imágenes
2. Política de privacidad → URL de arriba
3. Seguridad de los datos → `data-safety.md`
4. Clasificación de contenido → `content-rating.md`
5. Revisar `api-compliance.md` antes de publicar
