import { createTRPCRouter, baseProcedure } from '@/trpc/init';
import { db } from '@/db';
import { agent } from '@/db/schema';

export const agentsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    return await db.select().from(agent);
  })
});
