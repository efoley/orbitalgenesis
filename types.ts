export enum PlanetType {
  ROCKY = 'Rocky',
  GAS_GIANT = 'Gas Giant',
  ICE_GIANT = 'Ice Giant',
  DWARF = 'Dwarf'
}

export interface Orbit {
  a: number;       // Semi-major axis (pixels approx)
  e: number;       // Eccentricity (0 to 1)
  omega: number;   // Argument of periapsis (rotation of ellipse)
  period: number;  // Orbital period (arbitrary time units)
  meanAnomaly0: number; // Initial position at t=0
}

export interface Entity {
  id: string;
  radius: number;
  color: string;
  orbit: Orbit;
  name: string;
}

export interface Moon extends Entity {
  parentId: string;
}

export interface Planet extends Entity {
  type: PlanetType;
  moons: Moon[];
  description: string;
}

export interface AsteroidBelt {
  minRadius: number;
  maxRadius: number;
  count: number;
  particles: { angle: number; radius: number; speed: number; size: number }[];
}

export interface SolarSystem {
  star: {
    radius: number;
    color: string;
    mass: number;
  };
  planets: Planet[];
  asteroidBelts: AsteroidBelt[];
}