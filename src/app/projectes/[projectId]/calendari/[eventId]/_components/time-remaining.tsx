import type { Event } from "@/app/_data/event";
import { ClientOnly } from "@/components/client-only";

type Props = {
  event: Event;
  className?: string;
};

export default function TimeRemaining(props: Props) {
  return (
    <ClientOnly>
      <ClientTimeRemaining {...props} />
    </ClientOnly>
  );
}

function ClientTimeRemaining({ event, className }: Props) {
  const now = new Date();
  const timeRemaining = event.startAt.getTime() - now.getTime();

  if (timeRemaining < 0) {
    return null;
  }

  const oneHour = 1000 * 60 * 60;
  const oneDay = oneHour * 24;
  const days = Math.floor(timeRemaining / oneDay);
  const hours = Math.floor((timeRemaining % oneDay) / oneHour);

  if (days > 0) {
    if (days > 2 || hours === 0) {
      return <span className={className}>Falten {days} dies</span>;
    } else {
      return (
        <span className={className}>
          Falten {days} dies i {hours} hores
        </span>
      );
    }
  }

  if (hours > 1) {
    return <span className={className}>Falten {hours} hores</span>;
  }

  const minutes = Math.floor(timeRemaining / (1000 * 60));

  if (hours > 0) {
    return <span className={className}>Falta 1 hora i {minutes} minuts</span>;
  }

  if (minutes > 0) {
    return <span className={className}>Falten {minutes} minuts</span>;
  }
}
