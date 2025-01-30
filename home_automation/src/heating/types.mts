export enum ClimateName {
  TopBathroom = "top_bathroom_radiator",
  Bedroom1Left = "bedroom_1_left_radiator",
  Bedroom1Right = "bedroom_1_right_radiator",
  GuestRoom = "guest_room_radiator",
  LauraStudy = "laura_study_radiator",
  TopStudy = "top_study_radiator",
  LivingRoomFront = "living_room_front_radiator",
  MainBathroom = "bathroom_radiator", 

  // TODO - add once installed 
  // LivingRoomBack = "living_room_back_radiator",
  // Hallway = "hallway_radiator", 
  // Kitchen = "kitchen_radiator",
}

export enum TempSensor {
  // TODO - need to work out how to read temperature out of the TRVs too...
  LivingRoom = "living_room_temperature_temperature",
  TopStudy = "top_study_temperature_temperature",
  Bedroom1 = "bedroom_1_temperature_temperature",
}

export enum HeatingDemand {
  None = "none",
  Low = "low",
  High = "high"
}