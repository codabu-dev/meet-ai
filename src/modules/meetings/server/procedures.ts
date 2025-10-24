import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE
} from '@/constants';
import { db } from '@/db';
import { meeting } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike } from 'drizzle-orm';
import z from 'zod';

export const meetingsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select()
        .from(meeting)
        .where(
          and(eq(meeting.id, input.id), eq(meeting.userId, ctx.auth.user.id))
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found'
        });
      }
      return existingMeeting;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish()
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize } = input;
      const data = await db
        .select()
        .from(meeting)
        .where(
          and(
            eq(meeting.userId, ctx.auth.user.id),
            search ? ilike(meeting.name, `%${search}`) : undefined
          )
        )
        .orderBy(desc(meeting.createdAt), desc(meeting.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meeting)
        .where(
          and(
            eq(meeting.userId, ctx.auth.user.id),
            search ? ilike(meeting.name, `%${search}`) : undefined
          )
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages: totalPages
      };
    })
  //   create: protectedProcedure
  //     .input(agentsInsertSchema)
  //     .mutation(async ({ input, ctx }) => {
  //       const [createdAgent] = await db
  //         .insert(agent)
  //         .values({ ...input, userId: ctx.auth.user.id })
  //         .returning();

  //       return createdAgent;
  //     }),
  //   update: protectedProcedure
  //     .input(agentsUpdateSchema)
  //     .mutation(async ({ ctx, input }) => {
  //       const [updatedAgent] = await db
  //         .update(agent)
  //         .set(input)
  //         .where(and(eq(agent.id, input.id), eq(agent.userId, ctx.auth.user.id)))
  //         .returning();

  //       if (!updatedAgent) {
  //         throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
  //       }

  //       return updatedAgent;
  //     }),

  //   remove: protectedProcedure
  //     .input(z.object({ id: z.string() }))
  //     .mutation(async ({ ctx, input }) => {
  //       const [removedAgent] = await db
  //         .delete(agent)
  //         .where(and(eq(agent.id, input.id), eq(agent.userId, ctx.auth.user.id)))
  //         .returning();

  //       if (!removedAgent) {
  //         throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
  //       }
  //       return removedAgent;
  //     })
});
