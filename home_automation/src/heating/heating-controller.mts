import { HeatingDemand } from "./types.mts";
import { RoomHeating } from "./room.mts";

const FORCE_STATE_INTERVAL_SECONDS = 15 * 60; // 15 mins
const FORCE_STATE_TOGGLE_GAP_SECONDS = 10; // 10 seconds
const STATE_HEARTBEAT_INTERVAL_SECONDS = 60; // 1 min

export class HeatingController {
  private isStarted = false;
  private rooms: RoomHeating[] = [];
  private boilerCallback: (boolean) => void;

  private lastForcedStateAt?: Date;

  public registerRoom(room: RoomHeating) {
    if (!this.rooms.find(existingRoom => existingRoom.name === room.name)) {
      this.rooms.push(room);
    }
  }

  public registerBoilerCallback(callback: (boolean) => void) {
    this.boilerCallback = callback;
  }

  public start() {
    // TODO - consider whether we want the toggle behaviour straight away or not
    // this will delay it at least 15 mins from nodejs bootup
    this.lastForcedStateAt = new Date();

    setInterval(() => {
      this.heartbeat();
    }, 1000 * STATE_HEARTBEAT_INTERVAL_SECONDS);
    
    this.heartbeat();
  }

  private heartbeat() {
    this.logRoomStates();

    const currentState = this.updateState();

    const now = new Date();

    if (secondsBetweenDates(now, this.lastForcedStateAt) >= FORCE_STATE_INTERVAL_SECONDS) {
      console.log(`Forcing boiler state`);

      this.lastForcedStateAt = now;

      this.boilerCallback(!currentState);

      setTimeout(() => {
        this.boilerCallback(currentState);
      }, 1000 * FORCE_STATE_TOGGLE_GAP_SECONDS);
    }
  }

  private logRoomStates() {
    for (const room of this.rooms) {
      console.log(room.name, room.getState());
    }
  }

  private updateState() {
    const turnOnBoiler = this.shouldBoilerBeOn();

    console.log(`Setting boiler state to: ${turnOnBoiler ? "on" : "off"}`);

    this.boilerCallback(turnOnBoiler);

    return turnOnBoiler;
  }

  // boiler only supports a simple on/off
  // for now, replicating what we have in HA automations, with a little more logic
  private shouldBoilerBeOn(): boolean {
    const roomDemandCounts = this.rooms.reduce((acc, room) => {
      const heatingDemand = room.getHeatingDemand();
      acc.set(heatingDemand, acc.get(heatingDemand) + 1);
      return acc;
    }, new Map(Object.values(HeatingDemand).map(key => [key, 0])));

    if (roomDemandCounts.get(HeatingDemand.High) > 0) {
      // any room demanding lots of heat should enable the boiler
      // as it's likely the TRV is struggling to heat if it's open this much
      return true;
    }
    
    if (roomDemandCounts.get(HeatingDemand.Low) > 2) {
      // if more than 2 room are demanding _some_ heat, enable the boiler
      return true;
    }
    
    return false;
  }
}

const secondsBetweenDates = (date1: Date, date2: Date) => {
  const duration = Math.abs(date1.getTime() - date2.getTime());

  return Math.floor(duration / 1000);
}