import { HassEntityManager } from "@digital-alchemy/hass";
import { HeatingDemand, TempSensor, Trv } from "./types.mts";

export class RoomHeating {
  constructor(
    public name: string,
    private hassEntity: HassEntityManager,
    public readonly trvs: Trv[],
    public readonly tempSensors: TempSensor[],
  ) {}

  // TODO - it might be nice if a room understood _how long_ it was demanding heat, 
  // and what the differential between desired + current temperatures are

  public getState() {
    const temperatures: number[] = [];
    const trvPositions: number[] = [];
    let hasWindowOpen = false;

    for (const tempSensor of this.tempSensors) {
      // annoying this is typed as number but comes through as string :|
      const temperature = this.hassEntity.getCurrentState(`sensor.${tempSensor}`).state as unknown as string;
      temperatures.push(parseFloat(temperature));
    }

    for (const trv of this.trvs) {
      // annoying this is typed as number but comes through as string :|
      const currentPosition = this.hassEntity.getCurrentState(`sensor.${trv}_position`).state as unknown as string;
      const isWindowOpen = this.hassEntity.getCurrentState(`binary_sensor.${trv}_window_open`).state === "on";

      trvPositions.push(parseFloat(currentPosition));
      hasWindowOpen = hasWindowOpen || isWindowOpen;
    }

    return {
      temperature: {
        values: temperatures,
        min: temperatures.length && Math.min(...temperatures) || null,
        max: temperatures.length && Math.max(...temperatures) || null,
      },
      trvPositions: {
        values: trvPositions,
        min: trvPositions.length && Math.min(...trvPositions) || null,
        max: trvPositions.length && Math.max(...trvPositions) || null,
      },
      hasWindowOpen,
    };
  }

  public getHeatingDemand(): HeatingDemand {
    const state = this.getState();

    if (state.trvPositions.max >= 50) {
      return HeatingDemand.High;
    }
    else if (state.trvPositions.max > 0) {
      return HeatingDemand.Low;
    }
    else {
      return HeatingDemand.None;
    }
  }
}