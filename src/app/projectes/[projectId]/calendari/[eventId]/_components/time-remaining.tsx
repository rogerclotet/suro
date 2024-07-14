import type { Event } from "@/app/_data/event";

export default function TimeRemaining({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  const now = new Date();
  const timeRemaining = event.startAt.getTime() - now.getTime();

  if (timeRemaining < 0) {
    return null;
  }

  const oneHour = 1000 * 60 * 60;
  const oneDay = oneHour * 24;
  const days = Math.floor(timeRemaining / oneDay);
  const hours = Math.floor((timeRemaining % oneDay) / oneHour);

  if (days > 0 || hours > 0) {
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

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  if (minutes > 0) {
    return <span className={className}>Falten {minutes} minuts</span>;
  }
}
