import { LoadedModules } from "@digital-alchemy/core";
import { HassEntityManager, iCallService } from "@digital-alchemy/hass"

export type HassInjectable = {
  entity: HassEntityManager;
  call: iCallService;
}

export type SynapseInjectable = {
  device: ReturnType<LoadedModules["synapse"]["services"]["device"]>;
  text: ReturnType<LoadedModules["synapse"]["services"]["text"]>;
  sensor: ReturnType<LoadedModules["synapse"]["services"]["sensor"]>;
}