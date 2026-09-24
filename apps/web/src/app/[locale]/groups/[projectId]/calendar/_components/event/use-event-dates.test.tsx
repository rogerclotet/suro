import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import type * as v from "valibot";
import { afterEach, expect, it, vi } from "vitest";
import type { eventSchema } from "./data";
import { useEventDates } from "./use-event-dates";

type Values = v.InferInput<typeof eventSchema>;
const day = new Date(2026, 8, 24);
function Form({ initial }: { initial?: Values }) {
  const form = useForm<Values>({
    defaultValues: initial ?? {
      name: "Event",
      description: "",
      allDay: true,
      dates: { from: day, to: day },
    },
  });
  const handlers = useEventDates({ form });
  const values = form.watch();
  return (
    <>
      <input
        aria-label="Start"
        type="time"
        onChange={handlers.handleStartTimeChange}
      />
      <input
        aria-label="End"
        type="time"
        onChange={handlers.handleEndTimeChange}
      />
      <button
        type="button"
        onClick={() => handlers.handleAllDayChange(!values.allDay)}
      >
        Toggle all day
      </button>
      <button
        type="button"
        onClick={() =>
          handlers.handleDatesChange({
            from: new Date(2026, 8, 26),
            to: new Date(2026, 8, 26),
          })
        }
      >
        Move dates
      </button>
      <output data-testid="dates">{JSON.stringify(values)}</output>
    </>
  );
}
function expectDates(from: Date, to: Date, allDay: boolean) {
  const rendered = screen.getByTestId("dates").textContent ?? "";
  expect(rendered).toContain(`"from":"${from.toISOString()}"`);
  expect(rendered).toContain(`"to":"${to.toISOString()}"`);
  expect(rendered).toContain(`"allDay":${allDay}`);
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("preserves a new event's edited times through toggles and day selection", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 24, 10, 12));
  render(<Form />);
  expectDates(day, day, true);
  fireEvent.click(screen.getByText("Toggle all day"));
  expectDates(
    new Date(2026, 8, 24, 10, 30),
    new Date(2026, 8, 24, 11, 30),
    false,
  );
  fireEvent.change(screen.getByLabelText("Start"), {
    target: { value: "14:15" },
  });
  expectDates(
    new Date(2026, 8, 24, 14, 15),
    new Date(2026, 8, 24, 15, 15),
    false,
  );
  fireEvent.change(screen.getByLabelText("End"), {
    target: { value: "16:45" },
  });
  fireEvent.click(screen.getByText("Toggle all day"));
  fireEvent.click(screen.getByText("Move dates"));
  fireEvent.click(screen.getByText("Toggle all day"));
  expectDates(
    new Date(2026, 8, 26, 14, 15),
    new Date(2026, 8, 26, 16, 45),
    false,
  );
  fireEvent.click(screen.getByText("Move dates"));
  expectDates(
    new Date(2026, 8, 26, 14, 15),
    new Date(2026, 8, 26, 16, 45),
    false,
  );
});

it("restores the latest edit rather than the originally saved times", () => {
  render(
    <Form
      initial={{
        name: "Event",
        description: "",
        allDay: false,
        dates: {
          from: new Date(2026, 8, 24, 9),
          to: new Date(2026, 8, 24, 11, 30),
        },
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText("Start"), {
    target: { value: "23:30" },
  });
  expectDates(new Date(2026, 8, 24, 23, 30), new Date(2026, 8, 25, 2), false);
  fireEvent.click(screen.getByText("Toggle all day"));
  fireEvent.click(screen.getByText("Toggle all day"));
  expectDates(new Date(2026, 8, 24, 23, 30), new Date(2026, 8, 25, 2), false);
});

it("does not reuse the previous dialog's timed draft on reopening", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 24, 10, 12));
  const first = render(<Form />);
  fireEvent.click(screen.getByText("Toggle all day"));
  fireEvent.change(screen.getByLabelText("Start"), {
    target: { value: "18:00" },
  });
  first.unmount();
  render(<Form />);
  expectDates(day, day, true);
  fireEvent.click(screen.getByText("Toggle all day"));
  expectDates(
    new Date(2026, 8, 24, 10, 30),
    new Date(2026, 8, 24, 11, 30),
    false,
  );
});
