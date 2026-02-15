import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type * as schema from './db/schema';
import type { AuthenticatedUser } from './middleware/auth';

export type Bindings = {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

export type Variables = {
  db: NeonHttpDatabase<typeof schema>;
  user?: AuthenticatedUser;
};
