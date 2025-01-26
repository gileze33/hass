import { TServiceParams } from "@digital-alchemy/core";
import { TempSensor, Trv } from "./types.mts";
import { HeatingController } from "./heating-controller.mts";
import { RoomHeating } from "./room.mts";

export function Heating({ hass, config, logger }: TServiceParams) {  
  const heatingController = new HeatingController();

  heatingController.registerRoom(new RoomHeating("topStudy", hass.entity, [Trv.TopStudy], [TempSensor.TopStudy]));
  heatingController.registerRoom(new RoomHeating("livingRoom", hass.entity, [Trv.LivingRoomFront], [TempSensor.LivingRoom]));
  heatingController.registerRoom(new RoomHeating("bedroom1", hass.entity, [Trv.Bedroom1Left, Trv.Bedroom1Right], []));
  heatingController.registerRoom(new RoomHeating("topBathroom", hass.entity, [Trv.TopBathroom], []));
  heatingController.registerRoom(new RoomHeating("guestRoom", hass.entity, [Trv.GuestRoom], []));
  heatingController.registerRoom(new RoomHeating("lauraStudy", hass.entity, [Trv.LauraStudy], []));

  heatingController.registerBoilerCallback((demandHeat) => {
    logger.info(`Heating boiler callback: ${demandHeat}`);

    const boilerSwitch = hass.refBy.id("switch.kitchen_boiler");

    if (demandHeat) {
      boilerSwitch.turn_on();
    }
    else {
      boilerSwitch.turn_off();
    }
  });

  heatingController.start();

  logger.info(`Booted Heating module`);
};
