/**
 * Bundled imagery. These are official GTA VI promotional screenshots and trailer frames
 * (© Rockstar Games), sourced via gta.wiki. They live in one folder and one map so they can be
 * swapped or removed in a single change if a rights holder or App Review asks.
 */
export const PHOTOS = {
  duo: require('../assets/photos/duo.jpg'),
  heist: require('../assets/photos/heist.jpg'),
  chase: require('../assets/photos/chase.jpg'),
  robbery: require('../assets/photos/robbery.jpg'),
  sunset_tree: require('../assets/photos/sunset_tree.jpg'),
  jason_rifle: require('../assets/photos/jason_rifle.jpg'),
  jason_bike: require('../assets/photos/jason_bike.jpg'),
  lucia_bar: require('../assets/photos/lucia_bar.jpg'),
  lucia_fight: require('../assets/photos/lucia_fight.jpg'),
  vc_night: require('../assets/photos/vc_night.jpg'),
  vc_sign: require('../assets/photos/vc_sign.jpg'),
  vc_marina: require('../assets/photos/vc_marina.jpg'),
  vc_gas: require('../assets/photos/vc_gas.jpg'),
  vc_car: require('../assets/photos/vc_car.jpg'),
  vc_ferris: require('../assets/photos/vc_ferris.jpg'),
  vc_police: require('../assets/photos/vc_police.jpg'),
  la_perle: require('../assets/photos/la_perle.jpg'),
  keys_aerial: require('../assets/photos/keys_aerial.jpg'),
  keys_underwater: require('../assets/photos/keys_underwater.jpg'),
  grass_airboat: require('../assets/photos/grass_airboat.jpg'),
  grass_town: require('../assets/photos/grass_town.jpg'),
  port_motel: require('../assets/photos/port_motel.jpg'),
  port_town: require('../assets/photos/port_town.jpg'),
  ambrosia_sunset: require('../assets/photos/ambrosia_sunset.jpg'),
  ambrosia_bikers: require('../assets/photos/ambrosia_bikers.jpg'),
  kalaga_road: require('../assets/photos/kalaga_road.jpg'),
  kalaga_heli: require('../assets/photos/kalaga_heli.jpg'),
  vice_beach: require('../assets/photos/vice_beach.jpg'),
  hamlet: require('../assets/photos/hamlet.jpg'),
  key_lento: require('../assets/photos/key_lento.jpg'),
  stockyard: require('../assets/photos/stockyard.jpg'),
  tequesta: require('../assets/photos/tequesta.jpg'),
  airport: require('../assets/photos/airport.jpg'),
  waning_sands: require('../assets/photos/waning_sands.jpg'),
  peacock_bay: require('../assets/photos/peacock_bay.jpg'),
  crosstown: require('../assets/photos/crosstown.jpg'),
} as const;

export type PhotoKey = keyof typeof PHOTOS;

import type { CheatCategory, GuideCategory } from '@/types';

export const CHEAT_PHOTO: Record<CheatCategory, PhotoKey> = {
  player: 'lucia_fight',
  weapon: 'jason_rifle',
  vehicle: 'vc_car',
  world: 'vc_police',
  misc: 'vc_sign',
};

export const GUIDE_PHOTO: Record<GuideCategory, PhotoKey> = {
  launch: 'vc_sign',
  money: 'robbery',
  weapons: 'jason_rifle',
  vehicles: 'jason_bike',
  side: 'lucia_bar',
  tricks: 'heist',
};
