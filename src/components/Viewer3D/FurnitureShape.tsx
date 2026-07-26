import type { ShapeType } from "../../types/scene";
import { shade } from "../../utils/color";

interface ShapeProps {
  shapeType: ShapeType;
  /** footprint in METERS [width, depth] */
  w: number;
  d: number;
  /** overall height in METERS */
  h: number;
  color: string;
}

const dark = (c: string) => shade(c, -0.35);
const darker = (c: string) => shade(c, -0.55);
const light = (c: string) => shade(c, 0.25);

function Legs({ w, d, legH, legR, color }: { w: number; d: number; legH: number; legR: number; color: string }) {
  const inset = Math.min(w, d) * 0.12 + legR;
  const xs = [-(w / 2 - inset), w / 2 - inset];
  const zs = [-(d / 2 - inset), d / 2 - inset];
  const positions: [number, number][] = [];
  for (const x of xs) for (const z of zs) positions.push([x, z]);
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <cylinderGeometry args={[legR, legR * 0.8, legH, 10]} />
          <meshStandardMaterial color={dark(color)} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

/** Renders a recognizable furniture silhouette out of primitives, sized to the item's real footprint/height. */
export default function FurnitureShape({ shapeType, w, d, h, color }: ShapeProps) {
  switch (shapeType) {
    case "sofa":
    case "sofa-sectional": {
      const seatH = h * 0.5;
      const backH = h;
      const armW = w * 0.12;
      return (
        <group>
          <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - armW * 2, seatH, d]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, (seatH + backH) / 2, -d / 2 + d * 0.12]} castShadow>
            <boxGeometry args={[w - armW * 2, backH - seatH, d * 0.22]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (w / 2 - armW / 2), (seatH + backH * 0.85) / 2, 0]} castShadow>
              <boxGeometry args={[armW, backH * 0.85, d]} />
              <meshStandardMaterial color={dark(color)} roughness={0.85} />
            </mesh>
          ))}
          <Legs w={w} d={d} legH={h * 0.08} legR={Math.min(w, d) * 0.02} color={color} />
        </group>
      );
    }

    case "armchair": {
      const seatH = h * 0.5;
      return (
        <group>
          <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.8, seatH, d * 0.85]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, (seatH + h) / 2, -d / 2 + d * 0.14]} castShadow>
            <boxGeometry args={[w * 0.8, h - seatH, d * 0.24]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (w * 0.42), (seatH + h * 0.85) / 2, 0]} castShadow>
              <boxGeometry args={[w * 0.14, h * 0.85, d * 0.85]} />
              <meshStandardMaterial color={dark(color)} roughness={0.85} />
            </mesh>
          ))}
          <Legs w={w * 0.7} d={d * 0.7} legH={h * 0.1} legR={Math.min(w, d) * 0.025} color={color} />
        </group>
      );
    }

    case "chair": {
      const seatH = h * 0.5;
      const seatThick = h * 0.06;
      return (
        <group>
          <mesh position={[0, seatH, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, seatThick, d]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, seatH + (h - seatH) / 2, -d / 2 + seatThick / 2]} castShadow>
            <boxGeometry args={[w, h - seatH, seatThick]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <Legs w={w} d={d} legH={seatH} legR={Math.min(w, d) * 0.045} color={color} />
        </group>
      );
    }

    case "table-rect": {
      const topThick = Math.max(0.03, h * 0.06);
      return (
        <group>
          <mesh position={[0, h - topThick / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, topThick, d]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <Legs w={w} d={d} legH={h - topThick} legR={Math.min(w, d) * 0.035} color={color} />
        </group>
      );
    }

    case "table-round": {
      const topThick = Math.max(0.03, h * 0.08);
      const r = Math.min(w, d) / 2;
      return (
        <group>
          <mesh position={[0, h - topThick / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, topThick, 24]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[0, (h - topThick) / 2, 0]} castShadow>
            <cylinderGeometry args={[r * 0.08, r * 0.12, h - topThick, 12]} />
            <meshStandardMaterial color={dark(color)} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[r * 0.35, r * 0.35, 0.02, 16]} />
            <meshStandardMaterial color={dark(color)} roughness={0.6} />
          </mesh>
        </group>
      );
    }

    case "bed": {
      const frameH = h * 0.35;
      const mattressH = h * 0.4;
      return (
        <group>
          <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, frameH, d]} />
            <meshStandardMaterial color={dark(color)} roughness={0.8} />
          </mesh>
          <mesh position={[0, frameH + mattressH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.97, mattressH, d * 0.97]} />
            <meshStandardMaterial color={light(color)} roughness={0.9} />
          </mesh>
          <mesh position={[0, frameH + mattressH + h * 0.35, -d / 2 + 0.03]} castShadow>
            <boxGeometry args={[w, h * 0.7, 0.06]} />
            <meshStandardMaterial color={dark(color)} roughness={0.8} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (w * 0.28), frameH + mattressH + 0.06, -d / 2 + d * 0.16]}
              castShadow
            >
              <boxGeometry args={[w * 0.28, 0.12, d * 0.22]} />
              <meshStandardMaterial color="#f4f2ee" roughness={0.95} />
            </mesh>
          ))}
        </group>
      );
    }

    case "wardrobe":
    case "cabinet-tall":
    case "cabinet-low": {
      const doorGap = 0.01;
      const doors = shapeType === "cabinet-low" ? 2 : 2;
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          {Array.from({ length: doors }).map((_, i) => {
            const segW = w / doors - doorGap;
            const x = -w / 2 + segW / 2 + i * (w / doors) + doorGap / 2;
            return (
              <mesh key={i} position={[x, h / 2, d / 2 + 0.005]}>
                <boxGeometry args={[segW * 0.94, h * 0.92, 0.01]} />
                <meshStandardMaterial color={dark(color)} roughness={0.5} />
              </mesh>
            );
          })}
        </group>
      );
    }

    case "fridge": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[w / 2 - 0.02, h * 0.7, d / 2 + 0.005]}>
            <boxGeometry args={[0.02, h * 0.25, 0.03]} />
            <meshStandardMaterial color={dark(color)} />
          </mesh>
          <mesh position={[w / 2 - 0.02, h * 0.25, d / 2 + 0.005]}>
            <boxGeometry args={[0.02, h * 0.18, 0.03]} />
            <meshStandardMaterial color={dark(color)} />
          </mesh>
        </group>
      );
    }

    case "stove": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.4} />
          </mesh>
          {[[-w * 0.22, -d * 0.15], [w * 0.22, -d * 0.15], [-w * 0.22, d * 0.15], [w * 0.22, d * 0.15]].map(
            ([x, z], i) => (
              <mesh key={i} position={[x, h + 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[Math.min(w, d) * 0.11, Math.min(w, d) * 0.11, 0.01, 16]} />
                <meshStandardMaterial color="#1a1b1e" />
              </mesh>
            )
          )}
        </group>
      );
    }

    case "sink": {
      const cabinetH = h * 0.85;
      return (
        <group>
          <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, cabinetH, d]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          <mesh position={[0, cabinetH + h * 0.05, 0]} castShadow>
            <boxGeometry args={[w * 0.85, h * 0.1, d * 0.75]} />
            <meshStandardMaterial color="#e7ecef" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, h + 0.08, -d * 0.28]}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
            <meshStandardMaterial color="#c9cdd1" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      );
    }

    case "toilet": {
      return (
        <group>
          <mesh position={[0, h * 0.75, -d * 0.28]} castShadow>
            <boxGeometry args={[w * 0.8, h * 0.45, d * 0.28]} />
            <meshStandardMaterial color={color} roughness={0.25} />
          </mesh>
          <mesh position={[0, h * 0.28, d * 0.06]} castShadow>
            <cylinderGeometry args={[w * 0.42, w * 0.48, h * 0.5, 16]} />
            <meshStandardMaterial color={color} roughness={0.25} />
          </mesh>
          <mesh position={[0, h * 0.55, d * 0.06]}>
            <cylinderGeometry args={[w * 0.44, w * 0.44, h * 0.06, 20]} />
            <meshStandardMaterial color={dark(color)} roughness={0.3} />
          </mesh>
        </group>
      );
    }

    case "bathtub": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.2} />
          </mesh>
          <mesh position={[0, h * 0.75, 0]}>
            <boxGeometry args={[w * 0.88, h * 0.45, d * 0.72]} />
            <meshStandardMaterial color="#dfeaee" roughness={0.15} />
          </mesh>
        </group>
      );
    }

    case "shower": {
      return (
        <group>
          <mesh position={[0, 0.005, 0]} receiveShadow>
            <boxGeometry args={[w, 0.01, d]} />
            <meshStandardMaterial color={light(color)} roughness={0.3} />
          </mesh>
          {[
            [-w / 2, 0],
            [w / 2, 0],
            [0, -d / 2],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, h / 2, z]}>
              <boxGeometry args={[x === 0 ? w : 0.02, h, x === 0 ? 0.02 : d]} />
              <meshPhysicalMaterial color={color} transmission={0.7} roughness={0.05} thickness={0.01} />
            </mesh>
          ))}
        </group>
      );
    }

    case "lamp-floor": {
      const poleH = h * 0.85;
      return (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[w * 0.35, w * 0.4, 0.04, 16]} />
            <meshStandardMaterial color={dark(color)} metalness={0.4} />
          </mesh>
          <mesh position={[0, poleH / 2, 0]}>
            <cylinderGeometry args={[w * 0.04, w * 0.04, poleH, 10]} />
            <meshStandardMaterial color={dark(color)} metalness={0.5} />
          </mesh>
          <mesh position={[0, poleH + (h - poleH) / 2, 0]}>
            <coneGeometry args={[w * 0.45, h - poleH, 16, 1, true]} />
            <meshStandardMaterial color={color} roughness={0.9} side={2} />
          </mesh>
        </group>
      );
    }

    case "lamp-table": {
      return (
        <group>
          <mesh position={[0, h * 0.05, 0]}>
            <cylinderGeometry args={[w * 0.3, w * 0.35, h * 0.1, 12]} />
            <meshStandardMaterial color={dark(color)} />
          </mesh>
          <mesh position={[0, h * 0.4, 0]}>
            <cylinderGeometry args={[w * 0.06, w * 0.06, h * 0.5, 8]} />
            <meshStandardMaterial color={dark(color)} />
          </mesh>
          <mesh position={[0, h * 0.8, 0]}>
            <coneGeometry args={[w * 0.4, h * 0.35, 16, 1, true]} />
            <meshStandardMaterial color={color} roughness={0.9} side={2} />
          </mesh>
        </group>
      );
    }

    case "plant": {
      const potH = h * 0.3;
      return (
        <group>
          <mesh position={[0, potH / 2, 0]} castShadow>
            <cylinderGeometry args={[w * 0.35, w * 0.42, potH, 14]} />
            <meshStandardMaterial color="#a5673f" roughness={0.85} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * w * 0.15, potH + (h - potH) * (0.4 + i * 0.15), (i - 1) * w * 0.1]} castShadow>
              <icosahedronGeometry args={[w * (0.32 - i * 0.03), 0]} />
              <meshStandardMaterial color={shade("#3f6b3a", i * 0.08 - 0.1)} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      );
    }

    case "tv": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h * 0.9, 0.04]} />
            <meshStandardMaterial color="#0c0d10" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, h * 0.05, 0]}>
            <boxGeometry args={[w * 0.3, h * 0.1, 0.06]} />
            <meshStandardMaterial color={darker(color)} />
          </mesh>
        </group>
      );
    }

    case "rug": {
      return (
        <mesh position={[0, 0.005, 0]} receiveShadow>
          <boxGeometry args={[w, 0.01, d]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    }

    case "mirror": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, 0.03]} />
            <meshStandardMaterial color={dark(color)} />
          </mesh>
          <mesh position={[0, h / 2, 0.02]}>
            <boxGeometry args={[w * 0.86, h * 0.9, 0.01]} />
            <meshPhysicalMaterial color="#dfeaf0" roughness={0.02} metalness={0.6} />
          </mesh>
        </group>
      );
    }

    case "aircon": {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#eef1f3" roughness={0.4} />
          </mesh>
          <mesh position={[0, h * 0.15, d / 2 - 0.01]}>
            <boxGeometry args={[w * 0.9, h * 0.5, 0.01]} />
            <meshStandardMaterial color="#d7dade" roughness={0.3} />
          </mesh>
        </group>
      );
    }

    case "ceiling-fan": {
      const r = Math.min(w, d) / 2;
      return (
        <group>
          <mesh position={[0, h * 0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, h * 0.8, 8]} />
            <meshStandardMaterial color="#2b2d31" />
          </mesh>
          <mesh position={[0, h * 0.9, 0]}>
            <cylinderGeometry args={[0.08, 0.08, h * 0.2, 10]} />
            <meshStandardMaterial color="#2b2d31" />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, h * 0.85, 0]} rotation={[0, (i * Math.PI) / 2, 0]}>
              <boxGeometry args={[r * 1.7, 0.02, r * 0.28]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
          ))}
        </group>
      );
    }

    case "stairs": {
      const steps = 10;
      const stepH = h / steps;
      const stepD = d / steps;
      return (
        <group>
          {Array.from({ length: steps }).map((_, i) => (
            <mesh key={i} position={[0, stepH * (i + 0.5), d / 2 - stepD * (i + 0.5)]} castShadow receiveShadow>
              <boxGeometry args={[w, stepH, stepD]} />
              <meshStandardMaterial color={i % 2 === 0 ? color : dark(color)} roughness={0.8} />
            </mesh>
          ))}
        </group>
      );
    }

    case "generic-box":
    default:
      return (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
  }
}
