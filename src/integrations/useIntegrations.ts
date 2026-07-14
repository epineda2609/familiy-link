import { useSyncExternalStore } from "react";
import {
  integrations,
  type DispatchMessage,
  type IntegrationDescriptor,
} from "./simulatedIntegrations";

export function useIntegrationLog(): DispatchMessage[] {
  return useSyncExternalStore(
    integrations.subscribe,
    integrations.getLogSnapshot,
    () => [] as DispatchMessage[],
  );
}
export function useIntegrationRegistry(): IntegrationDescriptor[] {
  return useSyncExternalStore(
    integrations.subscribe,
    integrations.getRegistrySnapshot,
    () => [] as IntegrationDescriptor[],
  );
}
