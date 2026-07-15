import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_MODE,
  getModeConfig,
  isMode,
  type ModeConfig,
  type OperationalMode,
} from "./OperationalMode";

type Ctx = {
  mode: OperationalMode;
  config: ModeConfig;
  setMode: (m: OperationalMode) => void;
};

const ModeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "basuf.mode";

function detectInitial(): OperationalMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isMode(saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

export function OperationalModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OperationalMode>(DEFAULT_MODE);

  useEffect(() => {
    const detected = detectInitial();
    if (detected !== mode) setModeState(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.mode = mode;
      document.documentElement.dataset.density = getModeConfig(mode).density;
    }
  }, [mode]);

  const setMode = (m: OperationalMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  };

  return (
    <ModeContext.Provider
      value={{ mode, config: getModeConfig(mode), setMode }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside <OperationalModeProvider>");
  return ctx;
}
