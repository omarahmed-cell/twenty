import { Button } from 'twenty-ui/primitives/input';

export const WorkflowStepCmdEnterButton = ({
  title,
  onClick,
  disabled = false,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      variant={disabled ? 'outline' : 'solid'}
      color="accent"
    >
      {title}
    </Button>
  );
};
