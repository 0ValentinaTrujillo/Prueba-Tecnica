import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Note } from '../models/Note.js';

const DEMO_USERS = [
  {
    name: 'Ana Administradora',
    email: 'admin@demo.com',
    role: 'admin',
    passwordKey: 'demoAdminPassword',
  },
  {
    name: 'Pedro Usuario',
    email: 'user@demo.com',
    role: 'user',
    passwordKey: 'demoUserPassword',
  },
];

const DEMO_NOTES = [
  {
    title: 'Bienvenida',
    text: 'Arrastra esta nota por el lienzo: la posición se guarda sola.',
    status: 'hecho',
    position: { x: 60, y: 80 },
    color: '#cdb4db',
  },
  {
    title: 'Editar una nota',
    text: 'Cambia el título, el texto o el estado y pulsa Guardar.',
    status: 'en_curso',
    position: { x: 380, y: 140 },
    color: '#ffafcc',
  },
  {
    title: 'Crear notas',
    text: 'Usa "Nueva nota" para añadir tantas como necesites.',
    status: 'pendiente',
    position: { x: 700, y: 90 },
    color: '#a2d2ff',
  },
];

/**
 * Carga idempotente: crea las cuentas de demostración si faltan y las notas de
 * ejemplo solo cuando el tablero está vacío. Se puede ejecutar en cada arranque.
 */
export async function runSeed() {
  const created = [];

  for (const demo of DEMO_USERS) {
    const exists = await User.findOne({ email: demo.email });
    if (exists) continue;
    await User.create({
      name: demo.name,
      email: demo.email,
      role: demo.role,
      active: true,
      password: env[demo.passwordKey],
    });
    created.push(demo.email);
  }

  const noteCount = await Note.countDocuments();
  let notesCreated = 0;
  if (noteCount === 0) {
    const admin = await User.findOne({ email: 'admin@demo.com' });
    await Note.insertMany(
      DEMO_NOTES.map((note) => ({ ...note, createdBy: admin?._id, updatedBy: admin?._id }))
    );
    notesCreated = DEMO_NOTES.length;
  }

  return {
    createdUsers: created,
    notesCreated,
    summary: `${created.length} usuario(s) creados, ${notesCreated} nota(s) creadas`,
  };
}

// Ejecución directa: node src/seed/seed.js
const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('src/seed/seed.js');
if (isDirectRun) {
  connectDatabase()
    .then(runSeed)
    .then((result) => {
      console.log('[seed]', result.summary);
      console.log('[seed] cuentas demo -> admin@demo.com / user@demo.com');
      return disconnectDatabase();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[seed] error:', error);
      process.exit(1);
    });
}
