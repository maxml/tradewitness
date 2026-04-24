import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.postgresClient ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
