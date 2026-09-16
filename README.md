# Portal de equipo — tablero de notas

Aplicación web con acceso por roles, administración de usuarios, un tablero
compartido de notas tipo post-it sobre un lienzo libre y un dashboard cuyas
métricas calcula una función **AWS Lambda**.

Todo el proyecto se ejecuta y se demuestra **en local** con Docker Compose, sin
cuenta de AWS ni servicios de pago. Se incluye además la infraestructura como
código (AWS SAM + CloudFormation) para desplegarlo en AWS (EC2 + Lambda + S3 +
CloudFront) y para retirarlo.

---

## 1. Requisitos

**Para la ejecución local (recomendada):**

- Docker Desktop 4.x o Docker Engine 24+ con el plugin `docker compose` v2.
- Puertos libres: `8080` (frontend), `4000` (API), `27017` (MongoDB), `9000` (Lambda).

**Solo si quieres ejecutar sin Docker o lanzar las pruebas:**

- Node.js 20 o superior.
- MongoDB 7 accesible (o el MongoDB en memoria que usan las pruebas).

**Solo para el despliegue en AWS:**

- AWS CLI v2 y AWS SAM CLI, autenticados (`aws configure`).
- Un repositorio Git accesible desde la instancia EC2 (la instancia clona el
  proyecto para construir la API).

---

## 2. Arranque en local

```bash
git clone <URL-del-repositorio>
cd "PRUEBA TECNICA"
docker compose up --build
```

El primer arranque tarda unos minutos (construye tres imágenes). Cuando termine:

| Servicio | URL |
| --- | --- |
| Aplicación | http://localhost:8080 |
| API | http://localhost:4000/api/health |
| Lambda de métricas (RIE) | http://localhost:9000 |
| MongoDB | `mongodb://localhost:27017/team_portal` |

Para parar el entorno: `docker compose down`. Los datos **se conservan** (ver
[Persistencia](#5-persistencia)).

### Cuentas de demostración

Se cargan automáticamente en el primer arranque (`SEED_ON_START=true`):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@demo.com` | `Admin123!` |
| Usuario | `user@demo.com` | `User123!` |

En la pantalla de acceso hay un botón por cada cuenta que rellena el formulario.
Las contraseñas se pueden cambiar con las variables `DEMO_ADMIN_PASSWORD` y
`DEMO_USER_PASSWORD` (ver `.env.example`).

**Usuarios creados desde la aplicación:** un administrador entra en *Usuarios →
Nuevo usuario*, indica nombre, correo, contraseña (mínimo 8 caracteres) y rol.
Ese usuario inicia sesión en la misma pantalla de acceso con el correo y la
contraseña que le asignó el administrador; no hay registro público ni correo de
activación. Si más adelante se le desactiva, deja de poder entrar y también
pierde el acceso en la sesión que tuviera abierta.

### Recarga manual de las cuentas demo

```bash
docker compose exec api npm run seed
```

El seed es idempotente: crea lo que falte y no duplica ni pisa datos existentes.

---

## 3. Uso de la aplicación

- **Acceso** (`/login`): correo y contraseña. La sesión se guarda como JWT en el
  navegador y caduca a las 8 horas.
- **Dashboard** (`/dashboard`): total de notas y distribución por estado. Las
  cifras las calcula la Lambda; se actualizan al abrir la página o con el botón
  *Actualizar*.
- **Tablero** (`/tablero`): lienzo libre compartido por todo el equipo.
  - *Nueva nota* crea una nota en la zona visible del lienzo.
  - El título, el texto y el estado (*Pendiente*, *En curso*, *Hecho*) se editan
    sobre la propia nota y se confirman con **Guardar**.
  - **Eliminar** borra la nota (pide confirmación).
  - Las notas se arrastran con el ratón **desde su cabecera** (la banda superior
    con el icono ⠿); al soltarlas, la posición se guarda sola, sin pulsar nada.
  - Todos los usuarios activos ven y editan las mismas notas.
- **Usuarios** (`/usuarios`, solo administradores): listar, crear, editar
  (nombre, correo, rol y contraseña) y desactivar o reactivar.

### Roles

| | Tablero | Dashboard | Usuarios |
| --- | :---: | :---: | :---: |
| Administrador | ✅ | ✅ | ✅ |
| Usuario | ✅ | ✅ | ❌ |

La opción *Usuarios* ni siquiera aparece en el menú para el rol `user`, y la API
responde `403` si se intenta llamar a esos endpoints con un token de usuario.

### Reglas de integridad

- **Siempre queda al menos un administrador activo**: la API rechaza (`409`)
  desactivar o degradar al último administrador activo.
- Un administrador tampoco puede desactivar su propia cuenta.
- Un usuario **inactivo** no puede iniciar sesión (`403`) y su token deja de
  servir de inmediato: el middleware comprueba el estado en cada petición, así
  que si se le desactiva mientras navega, la siguiente acción le devuelve al
  acceso.

---

## 4. Arquitectura

```
Navegador
   │
   ├── Frontend  React 18 + Vite, servido por nginx (contenedor)
   │       │  nginx publica /api en el mismo origen → sin CORS
   │       ▼
   ├── API      Node 20 + Express 5 + Mongoose (contenedor)
   │       │         ├── usuarios, notas, autenticación JWT
   │       │         ▼
   │       │      MongoDB 7 (contenedor + volumen persistente)
   │       │         ▲
   │       └── GET /api/dashboard/metrics
   │                 │  (la API hace de pasarela, no calcula las métricas)
   │                 ▼
   └── Lambda   Node 20 sobre la imagen oficial de AWS Lambda con el
                Runtime Interface Emulator; agrega las notas en MongoDB
```

En AWS el mismo reparto se mantiene: la API en un contenedor sobre **EC2**, las
métricas en **Lambda** (Function URL), y el frontend en **S3** distribuido por
**CloudFront**, que además enruta `/api/*` hacia la EC2 para que la aplicación
siga funcionando en un único origen.

### Estructura del repositorio

```
Backend/           API Express (modelos, controladores, rutas, seed, pruebas)
Frontend/          SPA React + Vite (páginas, contexto de sesión, cliente HTTP)
Lambda/metrics/    Función Lambda de métricas + Dockerfile con el RIE
infra/             template.yaml (SAM/CloudFormation) y scripts de despliegue
docker-compose.yml Entorno local completo
```

### Decisiones

- **MongoDB** encaja con notas de esquema flexible y permite calcular las
  métricas con una única agregación (`$group` por estado) en la Lambda, sin
  traer las notas a memoria.
- **La API no calcula las métricas**: las delega siempre en la Lambda, tal y como
  pide el enunciado. Si la Lambda no responde, el dashboard muestra el error en
  lugar de un dato inventado.
- **JWT sin estado**, pero el estado `active` se comprueba contra la base de
  datos en cada petición, que es lo que permite expulsar a un usuario
  desactivado sin esperar a que caduque su token.
- **Arrastre desde la cabecera de la nota**, no desde toda la superficie, para
  que los campos de texto se puedan seleccionar y editar con normalidad.

### API

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/auth/login` | público |
| `POST` | `/api/auth/logout` | autenticado |
| `GET` | `/api/auth/me` | autenticado |
| `GET` | `/api/users` | administrador |
| `POST` | `/api/users` | administrador |
| `PUT` | `/api/users/:id` | administrador |
| `PATCH` | `/api/users/:id/status` | administrador |
| `GET` | `/api/notes` | autenticado |
| `POST` | `/api/notes` | autenticado |
| `PUT` | `/api/notes/:id` | autenticado |
| `PATCH` | `/api/notes/:id/position` | autenticado |
| `DELETE` | `/api/notes/:id` | autenticado |
| `GET` | `/api/dashboard/metrics` | autenticado (vía Lambda) |
| `GET` | `/api/health` | público |

---

## 5. Persistencia

MongoDB guarda sus datos en el volumen Docker `portal-equipo_mongo-data`, no en
el contenedor. Por tanto:

- `docker compose restart` o `docker compose down` + `docker compose up`
  **conservan** usuarios, notas, estados y posiciones.
- Reconstruir las imágenes (`docker compose up --build`) también los conserva.
- Solo se borran si se elimina el volumen a propósito:
  `docker compose down -v`.

El contenido, el estado y la posición de cada nota viven en la colección `notes`
y se escriben en el momento: al pulsar *Guardar* (contenido y estado) y al
soltar la nota (posición). Recargar la página vuelve a leerlos del servidor.

---

## 6. La función Lambda en local

La Lambda se ejecuta en el contenedor `lambda-metrics`, construido sobre la
imagen oficial `public.ecr.aws/lambda/nodejs:20`, que incluye el **Runtime
Interface Emulator**. Es el mismo código y el mismo contrato de invocación que
en AWS, sin cuenta ni despliegue remoto.

La API la invoca en `http://lambda-metrics:8080/2015-03-31/functions/function/invocations`.
Para invocarla a mano desde el host:

```bash
curl -s -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

Respuesta:

```json
{
  "statusCode": 200,
  "body": "{\"total\":3,\"byStatus\":[{\"status\":\"pendiente\",\"label\":\"Pendiente\",\"count\":1,\"percentage\":33.3}, ...],\"source\":\"aws-lambda:metrics\"}"
}
```

**Alternativa con AWS SAM CLI** (opcional, tampoco necesita cuenta de AWS):

```bash
cd infra
sam build
sam local invoke MetricsFunction \
  --event ../Lambda/metrics/events/metrics-event.json \
  --docker-network portal-equipo_default \
  --parameter-overrides MongoPrivateIp=mongo
```

---

## 7. Ejecución sin Docker (opcional)

Con un MongoDB accesible en `mongodb://localhost:27017`:

```bash
# 1. Lambda de métricas (contenedor o `sam local start-lambda`)
#    o bien deja LAMBDA_METRICS_URL apuntando al RIE ya levantado.

# 2. API
cd Backend
cp .env.example .env        # ajusta MONGODB_URI a localhost
npm install
npm run seed                # cuentas de demostración
npm start

# 3. Frontend
cd ../Frontend
npm install
npm run dev                 # http://localhost:5173, proxy /api → :4000
```

### Pruebas

```bash
cd Backend
npm test
```

11 pruebas sobre un MongoDB en memoria: acceso y credenciales, separación de
roles, alta de usuarios y su inicio de sesión, expulsión de usuarios
desactivados, la regla del último administrador activo, el ciclo completo de una
nota (crear, editar, mover, persistir, eliminar) y el cálculo de métricas del
handler real de la Lambda.

---

## 8. Despliegue en AWS

La plantilla `infra/template.yaml` (SAM + CloudFormation) crea:

- Una **VPC** con dos subredes públicas y su enrutado.
- **EC2** (Amazon Linux 2023) que instala Docker, arranca MongoDB con volumen y
  construye y ejecuta la API desde el repositorio indicado.
- **Lambda** `nodejs20.x` con las métricas del dashboard, dentro de la VPC y con
  Function URL.
- **S3** (privado) + **CloudFront** con Origin Access Control para el frontend,
  más un comportamiento `/api/*` que apunta a la EC2.
- El rol IAM de la instancia con acceso por **SSM Session Manager** (no se abre
  el puerto 22).

### Parámetros

| Parámetro | Obligatorio | Por defecto | Descripción |
| --- | :---: | --- | --- |
| `RepositoryUrl` | sí | — | Repositorio Git que clona la EC2 para construir la API |
| `JwtSecret` | sí | — | Secreto de firma de los JWT (mín. 16 caracteres) |
| `RepositoryBranch` | no | `main` | Rama a desplegar |
| `ProjectName` | no | `portal-equipo` | Prefijo de los recursos |
| `InstanceType` | no | `t3.small` | Tipo de instancia |
| `MongoPrivateIp` | no | `10.0.1.10` | IP privada fija de la EC2 (la usa la Lambda) |
| `DemoAdminPassword` / `DemoUserPassword` | no | `Admin123!` / `User123!` | Cuentas de demostración |

### Desplegar

```bash
cd infra
./deploy.sh --repo https://github.com/usuario/prueba-tecnica.git --region us-east-1
```

En Windows (PowerShell):

```powershell
cd infra
.\deploy.ps1 -Repo https://github.com/usuario/prueba-tecnica.git -Region us-east-1
```

El script encadena `sam build`, `sam deploy`, el build del frontend, `aws s3
sync` al bucket y la invalidación de CloudFront. Al terminar imprime la URL de
CloudFront, la de salud de la API y la Function URL de la Lambda. La instancia
tarda unos minutos más en construir la imagen de la API.

### Retirar

```bash
cd infra
./teardown.sh --region us-east-1        # o .\teardown.ps1 en PowerShell
```

Vacía el bucket (CloudFormation no borra buckets con objetos) y elimina la pila
completa, incluidos EC2, Lambda, CloudFront, la VPC y los roles.

> No se ha desplegado en AWS para esta entrega: la revisión completa se puede
> hacer con la ejecución local, que no depende de ninguna cuenta ni suscripción.

---

## 9. Tiempo empleado, alcance y pendientes

**Tiempo empleado:** aproximadamente 7 horas efectivas.

**Fuera de alcance por indicación del enunciado:** tableros múltiples, columnas,
asignación de notas, fechas, comentarios, adjuntos, notificaciones, historial,
colaboración en tiempo real y aplicaciones móviles nativas.

**Limitaciones conocidas y pendientes:**

- **Sin despliegue en AWS ejecutado.** La plantilla y los scripts están
  completos y la sintaxis validada, pero no se ha lanzado la pila en una cuenta
  real, así que el despliegue no está probado de extremo a extremo.
- **La Function URL de la Lambda usa `AuthType: NONE`.** Solo devuelve
  recuentos agregados de notas y la invoca la API, pero lo correcto en
  producción sería `AWS_IAM` con firma SigV4 desde la EC2, o mantenerla privada
  e invocarla con el SDK.
- **MongoDB corre en la propia instancia EC2**, con volumen local: sirve para la
  demostración, pero en producción correspondería un servicio gestionado
  (DocumentDB o Atlas) con copias de seguridad.
- **Sin colaboración en tiempo real** (queda fuera del alcance): dos personas en
  el tablero a la vez no ven los cambios del otro hasta recargar, y la última
  escritura sobre una misma nota gana.
- **HTTP entre CloudFront y la EC2** (`http-only` hacia el puerto 4000). Con un
  dominio y un certificado ACM debería ser HTTPS de extremo a extremo.
- **Sin pruebas automáticas del frontend**; la cobertura automatizada está en la
  API y en el handler de la Lambda.
- El tamaño del lienzo es fijo (2400 × 1600 px) con desplazamiento; no hay zoom.
