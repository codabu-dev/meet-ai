'use client';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

export const MeetingsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}));

  return <div>{JSON.stringify(data?.items)}</div>;
};

export const MeetingsViewLoading = () => {
  return (
    <LoadingState
      title='Loading Meetings'
      desc='This may take a few seconds.'
    />
  );
};

export const MeetingsViewErorr = () => {
  return (
    <ErrorState title='Error Loading Meetings' desc='Please try again later.' />
  );
};
