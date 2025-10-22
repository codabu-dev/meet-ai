'use client';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { columns } from '../components/columns';
import { DataTable } from '../components/data-table';

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      {data.length > 0 ? (
        <DataTable data={data} columns={columns} />
      ) : (
        <EmptyState
          title='Create your firts agent'
          desc='Create an agent to join your meeting. Each agent will follow your instructions and can interact with participants during the call.'
        />
      )}
    </div>
  );
};

export const AgentsViewLoading = () => {
  return (
    <LoadingState title='Loading Agents' desc='This may take a few seconds.' />
  );
};

export const AgentsViewErorr = () => {
  return (
    <ErrorState title='Error Loading Agents' desc='Please try again later.' />
  );
};
