import { HassEntityManager } from "@digital-alchemy/hass";
import { HeatingDemand, TempSensor } from "./types.mts";
import { BaseRadiator } from "./radiator.mts";

export class RoomHeating {
  constructor(
    public name: string,
    public readonly radiators: BaseRadiator[],
    public readonly tempSensor?: TempSensor,
  ) {}

  private hassEntityManager: HassEntityManager;

  setHassEntityManager(hassEntityManager: HassEntityManager) {
    this.hassEntityManager = hassEntityManager;

    for (const radiator of this.radiators) {
      radiator.setHassEntityManager(hassEntityManager);
    }
  }

  public getHeatingDemand(): HeatingDemand {
    const heatingDemands = this.radiators.map(radiator => {
      const state = radiator.getState();
      
      console.log(`${radiator.constructor.name} ${radiator.name}`, JSON.stringify(state));

      return state.heatingDemand;
    });

    return maxHeatingDemand(heatingDemands);
  }

  public heartbeat() {
    if (this.tempSensor) {
      const measuredRoomTemperature = this.hassEntityManager.getCurrentState(`sensor.${this.tempSensor}`).state;
      console.log(`${this.name} measuredTemperature: ${measuredRoomTemperature}`);

      for (const radiator of this.radiators) {
        radiator.setRoomTemperature(measuredRoomTemperature);
      }
    }
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