# Portal de Equipo - Tablero Compartido

Aplicación web de equipo con acceso por roles: administración de usuarios, un
tablero compartido de notas tipo post-it sobre un lienzo libre (con arrastrar
y soltar) y un dashboard cuyas métricas calcula una función **AWS Lambda**
independiente de la API.

Sirve como panel interno para que un equipo organice tareas en notas con
estado (*Pendiente*, *En curso*, *Hecho*), mientras un administrador gestiona
quién tiene acceso. Todo el mundo con sesión activa ve y edita el mismo
tablero en tiempo real de recarga (sin WebSockets: la última escritura gana).

---

## 1. Requisitos

- **Node.js** 20 o superior (probado con v22.21.0).
- **npm** (incluido con Node).
- Una cuenta de **MongoDB Atlas** (capa gratuita alcanza) — o cualquier
  MongoDB accesible por URI.
- Un navegador moderno: Chrome, Brave, Firefox o Edge.

---

## 2. Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Express 5, Mongoose, JWT (`jsonwebtoken`), bcrypt |
| Frontend | React 18, Vite, React Router |
| Base de datos | MongoDB Atlas |
| Métricas | AWS Lambda (Node 20), emulada en local con el Runtime Interface Emulator |
| Infraestructura como código | AWS SAM / CloudFormation (`infra/template.yaml`), sin desplegar en esta entrega |

---

## 3. Instalación local

```bash
git clone <repo>
```

**1. Backend**

```bash
cd Backend
npm install
```

Crea `Backend/.env` (usa `Backend/.env.example` como base) como mínimo,
tu cadena de conexión de Atlas:

```env
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/BD?appName=APP
LAMBDA_METRICS_URL=http://localhost:9000/2015-03-31/functions/function/invocations
SEED_ON_START=true
```

**2. Frontend**

```bash
cd Frontend
npm install
```

**3. Arrancar los tres servicios** (cada uno en su propia terminal):

```bash
# Backend — http://localhost:4000
cd Backend
npm run dev

# Frontend — http://localhost:5173
cd Frontend
npm run dev

# Lambda de métricas — http://localhost:9000
cd Lambda/metrics
npm install
npm run start:local
```

El backend hace *seed* automático de las cuentas de demostración al arrancar
(`SEED_ON_START=true`).

---

## 4. Uso

- **Login** (`/login`): con las cuentas demo de abajo, o cualquier cuenta que
  cree un administrador.
- **Tablero** (`/tablero`): lienzo compartido — todos los usuarios activos ven
  y editan las mismas notas (crear, arrastrar, cambiar estado, eliminar).
- **Dashboard** (`/dashboard`): métricas (total y distribución por estado),
  calculadas siempre por la Lambda, nunca por la API.
- **Usuarios** (`/usuarios`, solo administradores): alta, edición, rol y
  activar/desactivar.

---

## 5. Funcionalidades

- ✅ Autenticación con JWT
- ✅ CRUD de usuarios (solo administrador)
- ✅ Tablero compartido con arrastrar y soltar (mouse y táctil)
- ✅ Notas con paleta de colores fija, asignados al azar al crearlas
- ✅ Estados de nota: Pendiente, En curso, Hecho
- ✅ Dashboard con métricas calculadas por AWS Lambda
- ✅ Responsive: móvil, tablet y escritorio

---

## 6. Estructura de carpetas

```
Backend/    API Express (modelos, controladores, rutas, seed, pruebas)
Frontend/   SPA React + Vite (páginas, componentes, contexto de sesión)
Lambda/     Función de métricas + emulador local (RIE)
infra/      Plantilla AWS SAM/CloudFormation y scripts de despliegue
README.md   Este archivo
```

---

## 7. Cuentas demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.com` | `Admin123!` |
| Usuario | `user@demo.com` | `User123!` |

Se crean solas en el primer arranque del backend. En la pantalla de acceso hay
un botón por cuenta que rellena el formulario.

---

## 8. Limitaciones

- **Docker no se ejecutó en esta entrega** (sin virtualización habilitada en
  la máquina de desarrollo). El repositorio incluye `docker-compose.yml` y
  Dockerfiles, pero el flujo verificado y usado durante todo el desarrollo fue
  el de `npm install` + `npm run dev` en cada carpeta, no `docker compose up`.
- **No se desplegó en AWS** (sin cuenta activa). La plantilla SAM
  (`infra/template.yaml`) y los scripts de despliegue/retiro están escritos y
  con la sintaxis validada, pero no se lanzaron contra una cuenta real.
- **La Lambda de métricas requiere reinicio manual**: corre como proceso local
  (`npm run start:local`), así que si se cierra la terminal o el proceso muere,
  hay que volver a levantarla a mano — no se reinicia sola.
- **Pruebas automáticas**: 11 pasan, todas sobre un MongoDB en memoria
  (`cd Backend && npm test`). No hay pruebas automatizadas de frontend.

---

## 9. Tiempo empleado

- **Total:** aproximadamente 22 horas, repartidas en 3 días.
- **Fase 1:** Backend y autenticación (modelos, JWT, rutas, seed).
- **Fase 2:** Frontend y tablero (React, lienzo, arrastrar y soltar, CRUD de
  notas y usuarios).
- **Fase 3:** Dashboard, Lambda de métricas, responsividad y pulido visual
  (modales, toasts, validaciones, accesibilidad).

---

## 10. Notas importantes

- **Tipografía:** Mulish (Muli) en toda la aplicación.
- **Paleta de notas:** colores pastel fijos, elegidos al azar al crear cada
  nota (no configurable por el usuario).
- **Tablero compartido:** no hay tableros por usuario — todos ven y editan el
  mismo lienzo.
- **Regla de administrador mínimo:** siempre debe quedar al menos un
  administrador activo; la API rechaza (`409`) desactivar o degradar al
  último.
- **Seguridad antes de entregar:** `Backend/.env` (ignorado por git) contiene
  una cadena de conexión real de MongoDB Atlas — **cambia esa contraseña**
  antes de compartir el repositorio o las credenciales de este entorno.
