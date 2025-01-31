import { TServiceParams } from "@digital-alchemy/core";
import { TempSensor, ClimateName } from "./types.mts";
import { HeatingController } from "./heating-controller.mts";
import { RoomHeating } from "./room.mts";
import { CheapTRVRadiator, TS0601TRVRadiator } from "./radiator.mts";

export function Heating({ hass, config, logger, synapse, context }: TServiceParams) {  
  const heatingController = new HeatingController(hass, synapse, context);

  heatingController.registerRoom(new RoomHeating("topStudy", [new TS0601TRVRadiator(ClimateName.TopStudy)], TempSensor.TopStudy));
  heatingController.registerRoom(new RoomHeating("livingRoom", [new TS0601TRVRadiator(ClimateName.LivingRoomFront)], TempSensor.LivingRoom));
  heatingController.registerRoom(new RoomHeating("bedroom1", [new TS0601TRVRadiator(ClimateName.Bedroom1Left), new TS0601TRVRadiator(ClimateName.Bedroom1Right)], TempSensor.Bedroom1));
  heatingController.registerRoom(new RoomHeating("topBathroom", [new TS0601TRVRadiator(ClimateName.TopBathroom)]));
  heatingController.registerRoom(new RoomHeating("guestRoom", [new TS0601TRVRadiator(ClimateName.GuestRoom)]));
  heatingController.registerRoom(new RoomHeating("lauraStudy", [new TS0601TRVRadiator(ClimateName.LauraStudy)]));
  heatingController.registerRoom(new RoomHeating("bathroom", [new CheapTRVRadiator(ClimateName.MainBathroom)]));

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
