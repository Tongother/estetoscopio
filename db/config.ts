import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL!)
  throw new Error("La variable de entorno para la bd no está definida");

// Creamos el cliente de conexión para serverless
const sql = neon(process.env.DATABASE_URL!);

// Creamos la instancia de Drizzle, pasándole el cliente y el schema
export const db = drizzle({ client: sql });