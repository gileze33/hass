import { HeatingDemand, TempSensor } from "./types.mts";
import { BaseRadiator } from "./radiator.mts";
import { HassInjectable, SynapseInjectable } from "../hass-types.mts";
import { TContext } from "@digital-alchemy/core";
import { sentenceCase } from "change-case";
import { SynapseEntityProxy, TSynapseDeviceId } from "@digital-alchemy/synapse";

export class RoomHeating {
  constructor(
    public name: string,
    public readonly radiators: BaseRadiator[],
    public readonly tempSensor?: TempSensor,
  ) {}

  private hass: HassInjectable;

  private synapseDevice: TSynapseDeviceId;
  private synapseSensors: {
    heatingDemand?: ReturnType<SynapseInjectable["sensor"]>;
  } = {};

  public heatingDemand: HeatingDemand = HeatingDemand.Unknown;

  setHass(hass: HassInjectable) {
    this.hass = hass;

    for (const radiator of this.radiators) {
      radiator.setHass(hass);
    }
  }

  setSynapse(context: TContext, synapse: SynapseInjectable) {
    if (this.synapseDevice) {
      return;
    }

    this.synapseDevice = synapse.device.register(`room/${this.name}`, {
      name: sentenceCase(this.name),
    });

    this.synapseSensors.heatingDemand = synapse.sensor({
      device_id: this.synapseDevice,
      device_class: "enum",
      context,
      name: `${this.name}_heating_demand`,
      options: Object.values(HeatingDemand).map(option => sentenceCase(option)),
      state: {
        current: () => {
          console.log(`Current is ${this.heatingDemand}`);
          return sentenceCase(this.heatingDemand);
        },
      },
    });
  }

  public heartbeat() {
    if (this.tempSensor) {
      const measuredRoomTemperature = this.hass.entity.getCurrentState(`sensor.${this.tempSensor}`).state;
      console.log(`${this.name} measuredTemperature: ${measuredRoomTemperature}`);

      for (const radiator of this.radiators) {
        radiator.setRoomTemperature(measuredRoomTemperature);
      }
    }

    const heatingDemands = this.radiators.map(radiator => {
      const state = radiator.getState();
      
      console.log(`${radiator.constructor.name} ${radiator.name}`, JSON.stringify(state));

      return state.heatingDemand;
    });

    this.heatingDemand = maxHeatingDemand(heatingDemands);
  }
}

const maxHeatingDemand = (heatingDemands: HeatingDemand[]) => {
  if (heatingDemands.includes(HeatingDemand.High)) {
    return HeatingDemand.High;
  }
  
  if (heatingDemands.includes(HeatingDemand.Low)) {
    return HeatingDemand.Low;
  }

  return HeatingDemand.None;
};