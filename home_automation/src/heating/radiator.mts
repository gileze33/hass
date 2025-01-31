import { ClimateName, HeatingDemand } from "./types.mts";
import { HassInjectable } from "../hass-types.mts";

export type TRVState = {
  setTemperature: number;
  currentTemperature: number;
  temperatureOffset: number;
  measuredTemperature: number;
  currentPosition?: number;
  heatingDemand: HeatingDemand;
}

export abstract class BaseRadiator {
  protected hass: HassInjectable;

  constructor(
    public name: ClimateName,
  ) {}

  setHass(hass: HassInjectable) {
    this.hass = hass;
  }

  get temperatureOffset(): number {
    // annoying mistyping here too
    const offset = parseFloat(this.hass.entity.getCurrentState(`number.${this.name}_local_temperature_calibration`).state as unknown as string);

    return isNaN(offset) ? null : offset;
  }

  set temperatureOffset(desiredOffset: number) {
    console.log(`Setting desired offset for ${this.name}: ${desiredOffset}`);

    // this.hass.call.number.set_value({
    //   value: `${desiredOffset}`,
    //   entity_id: `number.${this.name}_local_temperature_calibration`,
    // });
  }

  get measuredTemperature(): number {
    const attributes = this.getAttributes();

    return attributes.current_temperature - this.temperatureOffset;
  }

  public setRoomTemperature(roomTemperature: number) {
    const measuredTemperature = this.measuredTemperature;

    if (!measuredTemperature) {
      console.warn(`Cannot update room temperature as measured temperature not available`);
      return;
    }

    const difference = this.measuredTemperature - roomTemperature;

    // desired offset not being set to the full difference to provide some kind of averaging..
    const desiredOffset = roundToNearestPoint5(difference === 0 ? 0 : difference / 2);

    this.temperatureOffset = desiredOffset;
  }

  protected getAttributes() {
    const attributes = this.hass.entity.getCurrentState(`climate.${this.name}`).attributes;

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
    const positionEntity = this.hass.entity.listEntities().find(entity => entity.includes(this.name) && entity.endsWith("position"));
    const currentPosition = this.hass.entity.getCurrentState(positionEntity).state as number;

    return currentPosition;
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