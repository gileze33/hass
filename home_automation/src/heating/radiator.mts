import { HassEntityManager } from "@digital-alchemy/hass";
import { ClimateName, HeatingDemand } from "./types.mts";

export type TRVState = {
  setTemperature: number;
  currentTemperature: number;
  temperatureOffset: number;
  measuredTemperature: number;
  currentPosition?: number;
  heatingDemand: HeatingDemand;
}

export abstract class BaseRadiator {
  protected hassEntityManager: HassEntityManager;

  constructor(
    public name: ClimateName,
  ) {}

  setHassEntityManager(hassEntityManager: HassEntityManager) {
    this.hassEntityManager = hassEntityManager;
  }

  get temperatureOffset(): number {
    // annoying mistyping here too
    const offset = parseFloat(this.hassEntityManager.getCurrentState(`number.${this.name}_local_temperature_calibration`).state as unknown as string);

    return isNaN(offset) ? null : offset;
  }

  get measuredTemperature(): number {
    const attributes = this.getAttributes();

    return attributes.current_temperature - this.temperatureOffset;
  }

  public setRoomTemperature(roomTemperature: number) {
    const measuredTemperature = this.measuredTemperature;

    if (!measuredTemperature) {
      console.log(`Cannot update room temperature as measured temperature not available`);
    }

    const desiredOffset = roundToNearestPoint5(this.measuredTemperature - roomTemperature);

    console.log(`Desired offset for ${this.name}: ${desiredOffset}`);

    // TODO - apply offset :) 
  }

  protected getAttributes() {
    const attributes = this.hassEntityManager.getCurrentState(`climate.${this.name}`).attributes;

    return attributes;
  }

  abstract getState(): TRVState;
}

export class CheapTRVRadiator extends BaseRadiator {
  private getHeatingDemand(currentTemperature: number, setTemperature: number): HeatingDemand {
    if ((setTemperature - currentTemperature) > 4) {
      return HeatingDemand.High;
    }
    else if ((setTemperature - currentTemperature) > 2) {
      return HeatingDemand.Low;
    }
    else {
      return HeatingDemand.None;
    }
  }

  public getState(): TRVState {
    const attributes = this.getAttributes();
    const heatingDemand = this.getHeatingDemand(attributes.current_temperature, attributes.temperature);

    return {
      currentTemperature: attributes.current_temperature,
      setTemperature: attributes.temperature,
      temperatureOffset: this.temperatureOffset,
      measuredTemperature: this.measuredTemperature,
      heatingDemand,
    };
  }
}

export class TS0601TRVRadiator extends BaseRadiator {
  private get currentPosition(): number {
    const positionEntity = this.hassEntityManager.listEntities().find(entity => entity.includes(this.name) && entity.endsWith("position"));
    const currentPosition = this.hassEntityManager.getCurrentState(positionEntity).state as number;

    return currentPosition;
  }

  get temperatureOffset(): number {
    // annoying mistyping here...
    return parseFloat(this.hassEntityManager.getCurrentState(`number.${this.name}_local_temperature_calibration`).state as unknown as string);
  }

  get measuredTemperature(): number {
    const attributes = this.getAttributes();

    return attributes.current_temperature - this.temperatureOffset;
  }
  
  private getHeatingDemand(currentPosition: number): HeatingDemand {
    if (currentPosition >= 50) {
      return HeatingDemand.High;
    }
    else if (currentPosition > 0) {
      return HeatingDemand.Low;
    }
    else {
      return HeatingDemand.None;
    }
  }

  public getState(): TRVState {
    const currentPosition = this.currentPosition;
    const heatingDemand = this.getHeatingDemand(currentPosition);
    const attributes = this.getAttributes();

    return {
      currentTemperature: attributes.current_temperature,
      setTemperature: attributes.temperature,
      temperatureOffset: this.temperatureOffset,
      measuredTemperature: this.measuredTemperature,
      currentPosition,
      heatingDemand,
    };
  }
}

const roundToNearestPoint5 = (input: number) => {
  return Math.round(input * 2) / 2;
}