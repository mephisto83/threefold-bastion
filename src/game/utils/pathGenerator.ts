import { Vector3 } from 'three';

export const generatePaths = (wave: number): Vector3[][] => {
  const count = 1 + Math.floor((wave - 1) / 3); // Increase paths every 3 waves
  const paths: Vector3[][] = [];
  const range = 40;

  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    const start = getEdgePoint(side, range);
    const end = getEdgePoint((side + 2) % 4, range); // Opposite side
    
    // Add some randomness to the path
    const mid1 = new Vector3(
      (Math.random() - 0.5) * range, 
      0, 
      (Math.random() - 0.5) * range
    );
    
    paths.push([start, mid1, end]);
  }
  return paths;
};

function getEdgePoint(side: number, range: number) {
    const r = (Math.random() - 0.5) * 2 * range;
    switch(side) {
        case 0: return new Vector3(r, 0, -range); // Top
        case 1: return new Vector3(range, 0, r); // Right
        case 2: return new Vector3(r, 0, range); // Bottom
        case 3: return new Vector3(-range, 0, r); // Left
        default: return new Vector3();
    }
}
