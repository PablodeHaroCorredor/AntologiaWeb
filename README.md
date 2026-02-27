# AntologiaWeb - Music Reviews

Aplicación web de reviews de canciones, playlists y álbumes conectada con la API de SoundCloud.

## Estructura del proyecto

- **`/backend`** – API Node.js (Express, MongoDB, SoundCloud OAuth, Socket.io)
- **`/frontend`** – App Next.js 15 (App Router, React 19, Tailwind, ShadCN-style UI)

## Requisitos

- Node.js 18+
- MongoDB
- Cuenta de desarrollador en [SoundCloud](https://soundcloud.com/you/apps) (client_id y client_secret)

## Configuración

### Backend

1. Entra en `backend` y copia el ejemplo de env:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Edita `backend/.env`:
   - `MONGODB_URI`: URI de MongoDB (ej. `mongodb://localhost:27017/antologia`)
   - `JWT_SECRET`: clave secreta para JWT (genera una segura)
   - `SOUNDCLOUD_CLIENT_ID` y `SOUNDCLOUD_CLIENT_SECRET`: de tu app en SoundCloud
   - `FRONTEND_URL`: URL del frontend (ej. `http://localhost:3000`)
   - `BACKEND_URL`: URL del backend (ej. `http://localhost:4000`) para el redirect OAuth

### Frontend

1. Entra en `frontend` y crea el env:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```
2. En `frontend/.env.local`:
   - `NEXT_PUBLIC_API_URL`: URL del backend (ej. `http://localhost:4000`)

## Cómo ejecutar

**Terminal 1 – Backend**
```bash
cd backend
npm install
npm run dev
```
Servidor en `http://localhost:4000`.

**Terminal 2 – Frontend**
```bash
cd frontend
npm install
npm run dev
```
App en `http://localhost:3000`.

## Funcionalidades

- **Búsqueda**: búsqueda de tracks y playlists en SoundCloud desde la app.
- **Reviews**: valoración de 1–5 estrellas, texto, borradores y publicación.
- **Feed**: “Fresh Critiques” con las últimas reviews y actualizaciones en tiempo real (Socket.io).
- **Interacción**: like en reviews de otros usuarios.
- **Perfiles**: perfil de usuario con sus reviews y estadísticas.
- **Auth**: inicio de sesión con SoundCloud (OAuth 2.1 con PKCE).
- **UI**: tema oscuro con acentos naranja tipo SoundCloud, sidebar en desktop y barra inferior en móvil.

## API (backend)

- `GET /api/health` – estado del servidor
- `GET /api/auth/soundcloud/authorize` – URL de autorización SoundCloud
- `GET /api/auth/soundcloud/callback` – callback OAuth (redirect)
- `GET /api/auth/me` – usuario actual (requiere auth)
- `POST /api/auth/logout` – cerrar sesión
- `GET /api/soundcloud/search?q=...&type=all|tracks|playlists` – búsqueda
- `GET /api/soundcloud/tracks/:id` – detalle de track
- `GET /api/soundcloud/playlists/:id` – detalle de playlist
- `GET /api/reviews` – listar reviews (query: userId, draft, limit, offset)
- `POST /api/reviews` – crear review (auth)
- `PATCH /api/reviews/:id` – actualizar review (auth)
- `DELETE /api/reviews/:id` – eliminar review (auth)
- `POST /api/reviews/:id/like` – like/unlike (auth)
- `GET /api/feed` – feed de reviews publicadas
- `GET /api/users/:id` – perfil de usuario
- `GET /api/users/:id/reviews` – reviews de un usuario
