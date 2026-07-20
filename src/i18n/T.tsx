import { useT } from "./LocaleProvider";
import type { MessageKey } from "./messages";

export function T({ k }: { k: MessageKey }) {
  const { t } = useT();
  return t(k);
}
