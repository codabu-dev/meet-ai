import ResponsiveDialog from '@/components/responsive-dialog';
import { MeetingGetOne } from '../../types';
import { MeetingForm } from './meeting-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: MeetingGetOne;
}

export const UpdateMeetingDialog = ({
  open,
  onOpenChange,
  initialValues
}: Props) => {
  return (
    <ResponsiveDialog
      title='Edit Meeting'
      desc='Edit the meeting details'
      open={open}
      onOpenChange={onOpenChange}
    >
      <MeetingForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
