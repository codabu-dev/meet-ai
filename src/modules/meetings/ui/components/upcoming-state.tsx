import { BanIcon, VideoIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '../../../../components/empty-state';
import { Button } from '../../../../components/ui/button';

interface Props {
  meetingId: string;
  onCancelMeeting: () => void;
  isCancelling: boolean;
}

export const UpcomingState = ({
  meetingId,
  onCancelMeeting,
  isCancelling
}: Props) => {
  return (
    <div className='bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center'>
      <EmptyState
        title='Not started yet'
        desc='Once you start this meeting, a summary will appear here'
        image='/upcoming.svg'
      />

      <div className='flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full'>
        <Button
          variant='secondary'
          onClick={onCancelMeeting}
          disabled={isCancelling}
          className='w-full lg:w-auto'
        >
          <BanIcon />
          Cancel meeting
        </Button>
        <Button asChild disabled={isCancelling} className='w-full lg:w-auto'>
          <Link href={`/call/${meetingId}`}>
            <VideoIcon />
            Start meeting
          </Link>
        </Button>
      </div>
    </div>
  );
};
