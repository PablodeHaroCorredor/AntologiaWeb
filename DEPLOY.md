# Despliegue: Vercel (frontend) + Render (backend)

Guía para desplegar AntologiaWeb con el frontend en Vercel y el backend en Render (plan gratuito). La base de datos (MongoDB) ya la tienes.

---

## Orden recomendado

1. Desplegar el **backend en Render** y anotar la URL.
2. Desplegar el **frontend en Vercel** usando esa URL.
3. Actualizar **variables en Render** con la URL de Vercel.
4. Configurar **SoundCloud** con las URLs de producción.

---

## Parte 1: Backend en Render

### 1.1 Subir el código a GitHub

Si aún no está subido:

- Crea un repositorio en GitHub.
- Sube el proyecto (carpetas `backend/`, `frontend/`, etc.).

### 1.2 Crear el servicio en Render

1. Entra en [render.com](https://render.com) e inicia sesión (o regístrate con GitHub).
2. **Dashboard** → **New** → **Web Service**.
3. Conecta tu cuenta de GitHub y elige el repositorio de AntologiaWeb.
4. Configura el servicio así:

| Campo | Valor |
|-------|--------|
| **Name** | `antologia-backend` (o el que quieras) |
| **Region** | El más cercano a ti (ej. Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

5. En **Advanced** (opcional):
   - Si quieres que no se duerma tan rápido: no hay opción en free; el servicio se duerme tras ~15 min sin peticiones.

### 1.3 Variables de entorno en Render

En el mismo Web Service, ve a **Environment** y añade:

| Key | Valor | Notas |
|-----|--------|--------|
| `MONGODB_URI` | `mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/nombre_db` | Tu URI de MongoDB Atlas |
| `JWT_SECRET` | Una cadena larga y aleatoria | Ej. genera una con `openssl rand -hex 32` |
| `PORT` | `4000` | Render asigna otro por defecto; suele usar `process.env.PORT` |
| `FRONTEND_URL` | `https://tu-app.vercel.app` | Lo cambiarás tras desplegar en Vercel (por ahora puedes poner `http://localhost:3000`) |
| `BACKEND_URL` | `https://antologia-backend.onrender.com` | **Sustituye** por la URL real que te dé Render (sin barra final) |
| `SOUNDCLOUD_CLIENT_ID` | Tu Client ID de SoundCloud | |
| `SOUNDCLOUD_CLIENT_SECRET` | Tu Client Secret de SoundCloud | |

- **Importante:** `BACKEND_URL` debe ser la URL pública del servicio (ej. `https://antologia-backend.onrender.com`). Render te la muestra en el dashboard del Web Service.
- En plan Free, Render asigna una URL como `https://<nombre-del-servicio>.onrender.com`.

### 1.4 Desplegar

- Pulsa **Create Web Service**.
- Render instalará dependencias y ejecutará `npm start`.
- Cuando termine, prueba: `https://tu-backend.onrender.com/api/health` → debería devolver `{"ok":true}`.

Anota la URL del backend (ej. `https://antologia-backend.onrender.com`). La usarás en Vercel y en SoundCloud.

---

## Parte 2: Frontend en Vercel

### 2.1 Crear el proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub).
2. **Add New** → **Project**.
3. Importa el mismo repositorio de AntologiaWeb.

### 2.2 Configurar el proyecto

1. **Configure Project**:
   - **Framework Preset:** Next.js (Vercel lo detecta).
   - **Root Directory:** haz clic en **Edit** y elige **`frontend`** (solo la carpeta del frontend).
   - **Build Command:** `npm run build` (por defecto).
   - **Output Directory:** lo deja Vercel para Next.js.
   - **Install Command:** `npm install`.

2. **Environment Variables** – añade:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://antologia-backend.onrender.com` |

- Sin barra final.
- Usa exactamente la URL de tu backend en Render.

3. Pulsa **Deploy**.

### 2.3 Anotar la URL del frontend

Cuando termine el deploy, Vercel te dará una URL tipo:

`https://antologia-web-xxxx.vercel.app`

Cópiala; la necesitas en Render y en SoundCloud.

---

## Parte 3: Enlazar backend y frontend

### 3.1 Actualizar Render con la URL de Vercel

1. En Render, abre tu Web Service (backend).
2. **Environment** → edita `FRONTEND_URL`:
   - Pónla igual a la URL de Vercel: `https://antologia-web-xxxx.vercel.app` (sin barra final).
3. Guarda. Render hará un **redeploy** automático.

Así CORS y la redirección tras el login de SoundCloud apuntan a tu frontend real.

---

## Parte 4: SoundCloud (OAuth)

1. Entra en [SoundCloud for Developers](https://developers.soundcloud.com/) y abre tu aplicación.
2. En **Redirect URIs** añade la URL del callback del **backend**:
   ```text
   https://antologia-backend.onrender.com/api/auth/soundcloud/callback
   ```
   (Sustituye por la URL real de tu backend en Render.)
3. Guarda los cambios.

Con esto, el login con SoundCloud funcionará en producción.

---

## Resumen de URLs

| Dónde | Variable / Uso | Ejemplo |
|-------|-----------------|--------|
| Render (backend) | `BACKEND_URL` | `https://antologia-backend.onrender.com` |
| Render (backend) | `FRONTEND_URL` | `https://tu-proyecto.vercel.app` |
| Vercel (frontend) | `NEXT_PUBLIC_API_URL` | `https://antologia-backend.onrender.com` |
| SoundCloud app | Redirect URI | `https://antologia-backend.onrender.com/api/auth/soundcloud/callback` |

---

## Comportamiento del plan Free de Render

- El backend se **duerme** tras unos 15 minutos sin recibir peticiones.
- La **primera petición** después de eso puede tardar 30–60 segundos (cold start).
- Las siguientes serán rápidas hasta que vuelva a quedar inactivo.

Si más adelante quieres evitar cold starts, puedes pasar al plan de pago de Render o usar otro servicio (por ejemplo Railway).

---

## Comprobar que todo funciona

1. **Backend:**  
   `https://tu-backend.onrender.com/api/health` → `{"ok":true}`.

2. **Frontend:**  
   Abre la URL de Vercel; la app debe cargar y las llamadas a la API deben ir al backend en Render.

3. **Login:**  
   Iniciar sesión con SoundCloud; debe redirigir a tu dominio de Vercel y guardar el token correctamente.

Si algo falla, revisa en Render los **Logs** del Web Service y en Vercel el **Build** y la pestaña **Functions/Logs** si usas serverless.
