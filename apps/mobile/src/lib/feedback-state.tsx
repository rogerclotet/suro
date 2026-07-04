import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { FeedbackSheet } from "@/components/feedback-sheet";

type FeedbackContextValue = {
  openFeedback: () => void;
  closeFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/** Mount once inside `SheetHost` so the feedback drawer shares FAB/sheet chrome. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const openFeedback = useCallback(() => setVisible(true), []);
  const closeFeedback = useCallback(() => setVisible(false), []);
  const value = useMemo(
    () => ({ openFeedback, closeFeedback }),
    [openFeedback, closeFeedback],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackSheet visible={visible} onClose={closeFeedback} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
