# Portal de Equipo — Tablero Compartido

Aplicación web de equipo con acceso por roles: administración de usuarios, un
tablero compartido de notas tipo post-it sobre un lienzo libre (con arrastrar y
soltar) y un dashboard cuyas métricas calcula una función **AWS Lambda**
independiente de la API.

Todo el equipo con sesión activa ve y edita el mismo tablero; un administrador
gestiona quién tiene acceso. Estados de nota: *Pendiente*, *En curso*, *Hecho*.

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + React Router (servido por nginx en Docker) |
| Backend | Express 5, Mongoose, JWT (`jsonwebtoken`), bcryptjs |
| Base de datos | MongoDB 7 (contenedor en Docker) / MongoDB Atlas (modo local) |
| Métricas | AWS Lambda Node 20 sobre la imagen oficial con Runtime Interface Emulator |
| Infraestructura como código | AWS SAM / CloudFormation (`infra/template.yaml`) |

---

## 1. Requisitos del sistema

**Para el camino con Docker (recomendado):**

- **Docker Engine** con Compose v2 (verificado con Docker 29.8.0 y Compose v5.5.1).
- 4 GB de RAM libres y los puertos `8080`, `4000`, `9000` y `27017` disponibles.
- No hace falta Node ni MongoDB instalados en la máquina.

**Para el camino sin Docker:**

- **Node.js 20 o superior** (verificado con v24.11.0) y **npm**.
- Una base de datos MongoDB accesible por URI: **MongoDB Atlas** (la capa
  gratuita es suficiente) o un MongoDB local.
- Navegador moderno: Chrome, Brave, Firefox o Edge.

---

## 2. Instalación con Docker (paso a paso)

**1. Clonar el repositorio y situarse en la raíz**

```bash
git clone <url-del-repo>
cd "PRUEBA TECNICA"
```

**2. (Opcional) Ajustar variables**

Todas tienen valor por defecto, así que el entorno arranca sin configurar nada.
Para cambiarlas, copia `.env.example` a `.env` en la raíz:

```bash
cp .env.example .env
```

| Variable | Valor por defecto |
| --- | --- |
| `JWT_SECRET` | `dev-secret-cambiar-en-produccion` |
| `DEMO_ADMIN_PASSWORD` | `Admin123!` |
| `DEMO_USER_PASSWORD` | `User123!` |

**3. Levantar los cuatro servicios**

```bash
docker compose up -d --build
```

Compose construye e inicia `portal-mongo`, `portal-lambda-metrics`, `portal-api`
y `portal-frontend`. La API espera a que Mongo esté *healthy* antes de arrancar y
crea las cuentas de demostración en el primer arranque (`SEED_ON_START=true`).

**4. Comprobar que todo responde**

```bash
docker compose ps                       # los 4 contenedores en "Up"
curl http://localhost:4000/api/health   # {"status":"ok","uptime":...}
```

| Servicio | URL | Detalle |
| --- | --- | --- |
| Frontend | <http://localhost:8080> | nginx sirve la SPA y hace de proxy de `/api` hacia la API |
| API | <http://localhost:4000/api> | Express; salud en `/api/health` |
| Lambda de métricas | <http://localhost:9000> | invocación: `POST /2015-03-31/functions/function/invocations` |
| MongoDB | `mongodb://localhost:27017/team_portal` | volumen `mongo-data`: los datos sobreviven a `down` |

**5. Abrir la aplicación** en <http://localhost:8080> e iniciar sesión con las
cuentas de la sección 4.

**6. Parar el entorno**

```bash
docker compose down        # conserva los datos en el volumen
docker compose down -v     # borra también la base de datos
```

Para invocar la Lambda directamente, sin pasar por la API:

```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" -d "{}"
```

---

## 3. Instalación sin Docker (3 terminales)

Requiere una URI de MongoDB (Atlas o local), porque en este modo no hay
contenedor de base de datos.

**Preparación (una sola vez)**

```bash
cd Backend  && npm install && cd ..
cd Frontend && npm install && cd ..
cd Lambda/metrics && npm install && cd ../..
```

Crea `Backend/.env` a partir de `Backend/.env.example` con, como mínimo:

```env
PORT=4000
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/BD?appName=APP
JWT_SECRET=dev-secret-cambiar-en-produccion
LAMBDA_METRICS_URL=http://localhost:9000/2015-03-31/functions/function/invocations
SEED_ON_START=true
```

> El host `lambda-metrics:8080` solo resuelve dentro de la red de Compose; fuera
> de Docker la Lambda vive en `localhost:9000`.

**Terminal 1 — Lambda de métricas (arráncala primero)**

```bash
cd Lambda/metrics
npm run start:local        # http://localhost:9000
```

`local-server.mjs` emula el Runtime Interface Emulator sobre el handler real, así
que la ruta de invocación es idéntica a la de AWS.

**Terminal 2 — API**

```bash
cd Backend
npm run dev                # http://localhost:4000
```

**Terminal 3 — Frontend**

```bash
cd Frontend
npm run dev                # http://localhost:5173
```

Vite redirige `/api` a `http://localhost:4000`, así que no hay CORS que
configurar. Abre <http://localhost:5173>.

> Ojo: en este modo el frontend es **5173** (servidor de desarrollo de Vite), no
> 8080 — el 8080 es el nginx del contenedor.

**Pruebas del backend** (levantan un MongoDB en memoria, no tocan Atlas):

```bash
cd Backend && npm test     # 11 pruebas en verde
```

---

## 4. Credenciales de demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.com` | `Admin123!` |
| Usuario | `user@demo.com` | `User123!` |

Se crean solas en el primer arranque del backend, junto con tres notas de
ejemplo. En la pantalla de acceso hay un botón por cuenta que rellena el
formulario. Las contraseñas se pueden cambiar con `DEMO_ADMIN_PASSWORD` y
`DEMO_USER_PASSWORD`.

---

## 5. Funcionalidades completadas

- [x] **Autenticación con JWT** y sesión persistente (`/api/auth/login`, `/logout`, `/me`).
- [x] **Roles** `admin` y `user`, con rutas protegidas en API y frontend.
- [x] **CRUD de usuarios** (solo administrador): alta, edición, cambio de rol y activar/desactivar.
- [x] **Tablero compartido** de notas post-it sobre lienzo libre, con arrastrar y soltar (ratón y táctil); la posición se guarda sola.
- [x] **CRUD de notas**: crear, editar título/texto/estado, mover y eliminar.
- [x] **Estados de nota**: Pendiente, En curso, Hecho; colores pastel asignados al azar al crear.
- [x] **Dashboard** con total y distribución por estado, calculado **siempre por la Lambda**, nunca por la API (la respuesta llega marcada con `"source":"aws-lambda:metrics"`).
- [x] **Docker Compose**: los cuatro servicios levantan y se comunican entre sí (verificado de extremo a extremo).
- [x] **Infraestructura como código**: plantilla SAM/CloudFormation con EC2 + Lambda + S3 + CloudFront y scripts de despliegue para Bash y PowerShell.
- [x] **Pruebas automáticas del backend**: 11 pruebas, incluidas las del handler real de la Lambda.
- [x] **Diseño responsive**: móvil, tablet y escritorio.
- [ ] **Despliegue real en AWS**: no ejecutado (ver limitaciones).

---

## 6. Estructura de carpetas

```
.
├── Backend/                  API Express
│   ├── src/
│   │   ├── config/           env.js y conexión a MongoDB
│   │   ├── controllers/      auth, users, notes, dashboard
│   │   ├── middleware/       autenticación, rol admin, errores
│   │   ├── models/           User.js, Note.js (Mongoose)
│   │   ├── routes/           router de /api
│   │   ├── seed/             cuentas y notas de demostración
│   │   ├── app.js            creación de la app Express
│   │   └── server.js         arranque + seed opcional
│   ├── tests/                api.test.js, metrics-lambda.test.js
│   └── Dockerfile
├── Frontend/                 SPA React + Vite
│   ├── src/
│   │   ├── api/              cliente HTTP
│   │   ├── components/       modales, notas, tabla, toasts, iconos
│   │   ├── context/          AuthContext, ToastContext
│   │   ├── pages/            Login, Tablero, Dashboard, Usuarios
│   │   └── styles.css
│   ├── nginx.conf            SPA + proxy /api → api:4000
│   ├── vite.config.js        puerto 5173 y proxy de desarrollo
│   └── Dockerfile            build con Node 20 → runtime nginx
├── Lambda/metrics/           Función de métricas del dashboard
│   ├── index.mjs             handler real (el que se despliega)
│   ├── local-server.mjs      emulador RIE para ejecutarla sin Docker
│   ├── events/               evento de ejemplo para invocarla
│   └── Dockerfile            public.ecr.aws/lambda/nodejs:20
├── infra/                    Infraestructura como código
│   ├── template.yaml         SAM/CloudFormation (EC2 + Lambda + S3 + CloudFront)
│   ├── deploy.sh / deploy.ps1
│   └── teardown.sh / teardown.ps1
├── docker-compose.yml        Los 4 servicios del entorno local
├── .env.example              Variables opcionales de Compose
└── README.md
```

---

## 7. Limitaciones conocidas

- **Sin despliegue real en AWS**: no se dispone de cuenta AWS activa, así que la
  plantilla SAM y los scripts de `infra/` están escritos y con la sintaxis
  revisada, pero **nunca se han lanzado contra una cuenta real**. El requisito de
  IaC se entrega como código, no como stack desplegado.
- **Sin tiempo real**: el tablero es compartido, pero no hay WebSockets. Los
  cambios de otro usuario se ven al recargar y, ante ediciones simultáneas de la
  misma nota, gana la última escritura.
- **Sin pruebas automáticas de frontend**: solo se valida con `npm run build` y
  prueba manual en navegador.
- **Colores de nota no configurables**: se eligen al azar de una paleta pastel
  fija al crear la nota.
- **Lambda local sin Docker**: en el camino de las 3 terminales,
  `npm run start:local` es un proceso suelto; si se cierra la terminal, el
  dashboard deja de responder hasta volver a levantarla a mano. Con Docker no
  pasa (`restart: unless-stopped`).
- **Sin paginación en el tablero**: con muchísimas notas el lienzo puede volverse
  pesado; la tabla de usuarios sí pagina.

---

## 8. Notas importantes

- **La métrica la calcula la Lambda, no la API.** `GET /api/dashboard/metrics`
  invoca la función y devuelve su respuesta tal cual, incluido el campo
  `"source":"aws-lambda:metrics"`. Si la Lambda no está levantada, el dashboard
  falla a propósito en lugar de calcular el dato por su cuenta.
- **Puerto 8080 vs 5173**: 8080 es el frontend dentro de Docker (nginx); 5173 es
  el servidor de desarrollo de Vite. No se usan a la vez.
- **Regla de administrador mínimo**: siempre debe quedar al menos un
  administrador activo; la API responde `409` si se intenta desactivar o degradar
  al último.
- **Persistencia**: el volumen `mongo-data` conserva los datos entre reinicios.
  Usa `docker compose down -v` para empezar de cero.
- **Seguridad**: `Backend/.env` está ignorado por git y en el repositorio no se
  publica ninguna credencial real. Las contraseñas de demo (`Admin123!`,
  `User123!`) y el `JWT_SECRET` por defecto son **solo para desarrollo**: en
  cualquier entorno real hay que cambiarlos.
- **Tipografía**: Mulish en toda la aplicación.

---

## 9. Tiempo empleado

**Aproximadamente 22 horas**, repartidas en tres días (15–17 de septiembre de 2026):

| Fase | Contenido |
| --- | --- |
| Fase 1 | Backend y autenticación: modelos, JWT, rutas, seed, pruebas |
| Fase 2 | Frontend y tablero: React, lienzo, arrastrar y soltar, CRUD de notas y usuarios |
| Fase 3 | Dashboard y Lambda de métricas, Docker Compose, plantilla SAM |
| Fase 4 | Responsividad y pulido visual: modales, toasts, validaciones, iconos, accesibilidad |
