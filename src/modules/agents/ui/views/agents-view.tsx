'use client';

import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAgentsFilters } from '../../hooks/use-agents-filters';
import { columns } from '../components/columns';
import { DataPagination } from '@/components/data-pagination';


export const AgentsView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [filters, setFilters] = useAgentsFilters();

  const { data } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions({ ...filters })
  );

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      {data.items.length > 0 ? (
        <>
          <DataTable
            data={data.items}
            columns={columns}
            onRowClick={(row) => router.push(`/agents/${row.id}`)}
          />
          <DataPagination
            page={filters.page}
            totalPages={data.totalPages}
            onPageChange={(page) => setFilters({ page })}
          />
        </>
      ) : (
        <EmptyState
          title='Create your first agent'
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
