import { useMemo } from "react";
import * as THREE from "three";
import { useSceneStore } from "../../store/sceneStore";
import type { Opening, Wall } from "../../types/scene";

const CM_TO_M = 0.01;

/**
 * Builds wall segments for a single wall, subtracting any openings on it.
 * Rather than true CSG boolean subtraction (expensive, fiddly on the web),
 * we split the wall into a strip of box segments left/right/above each opening.
 * Good enough for an MVP look; swap for real CSG later if you need exact bevels.
 */
function buildWallSegments(wall: Wall, openings: Opening[]) {
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);

  const wallOpenings = openings
    .filter((o) => o.wallId === wall.id)
    .map((o) => ({ ...o }))
    .sort((a, b) => a.position - b.position);

  type Segment = { from: number; to: number; bottom: number; top: number };
  const segments: Segment[] = [];

  let cursor = 0;
  for (const o of wallOpenings) {
    const openStart = o.position - o.width / 2;
    const openEnd = o.position + o.width / 2;

    if (openStart > cursor) {
      segments.push({ from: cursor, to: openStart, bottom: 0, top: wall.height });
    }

    if (o.type === "door") {
      // solid strip above the door frame
      segments.push({ from: openStart, to: openEnd, bottom: o.height, top: wall.height });
    } else {
      // window: solid strip below the sill and above the header
      const sill = o.sillHeight ?? 90;
      if (sill > 0) segments.push({ from: openStart, to: openEnd, bottom: 0, top: sill });
      segments.push({ from: openStart, to: openEnd, bottom: sill + o.height, top: wall.height });
    }

    cursor = openEnd;
  }
  if (cursor < length) {
    segments.push({ from: cursor, to: length, bottom: 0, top: wall.height });
  }

  return { segments, angle, length };
}

function WallMesh({ wall, openings }: { wall: Wall; openings: Opening[] }) {
  const { segments, angle, length } = useMemo(() => buildWallSegments(wall, openings), [wall, openings]);
  const midX = (wall.start[0] + wall.end[0]) / 2;
  const midZ = (wall.start[1] + wall.end[1]) / 2;
  const thicknessM = wall.thickness * CM_TO_M;

  return (
    <group position={[midX * CM_TO_M, 0, midZ * CM_TO_M]} rotation={[0, -angle, 0]}>
      {segments.map((seg, i) => {
        const segLenM = (seg.to - seg.from) * CM_TO_M;
        const segHeightM = (seg.top - seg.bottom) * CM_TO_M;
        const centerAlong = (seg.from + seg.to) / 2 - length / 2;
        const centerY = (seg.bottom + seg.top) / 2;
        return (
          <mesh
            key={i}
            position={[centerAlong * CM_TO_M, centerY * CM_TO_M, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[segLenM, segHeightM, thicknessM]} />
            <meshStandardMaterial color="#e8e6df" roughness={0.9} metalness={0.02} />
          </mesh>
        );
      })}
    </group>
  );
}

function DoorWindowFrames({ openings, walls }: { openings: Opening[]; walls: Wall[] }) {
  return (
    <>
      {openings.map((o) => {
        const wall = walls.find((w) => w.id === o.wallId);
        if (!wall) return null;
        const dx = wall.end[0] - wall.start[0];
        const dz = wall.end[1] - wall.start[1];
        const len = Math.hypot(dx, dz);
        const ux = dx / len;
        const uz = dz / len;
        const cx = wall.start[0] + ux * o.position;
        const cz = wall.start[1] + uz * o.position;
        const angle = Math.atan2(dz, dx);
        const thicknessM = wall.thickness * CM_TO_M;

        if (o.type === "door") {
          return (
            <mesh
              key={o.id}
              position={[cx * CM_TO_M, (o.height / 2) * CM_TO_M, cz * CM_TO_M]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[(o.width - 4) * CM_TO_M, (o.height - 2) * CM_TO_M, thicknessM * 0.5]} />
              <meshStandardMaterial color="#8a5a34" roughness={0.6} />
            </mesh>
          );
        }
        const sill = o.sillHeight ?? 90;
        return (
          <mesh
            key={o.id}
            position={[cx * CM_TO_M, (sill + o.height / 2) * CM_TO_M, cz * CM_TO_M]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[(o.width - 4) * CM_TO_M, (o.height - 4) * CM_TO_M, thicknessM * 0.3]} />
            <meshPhysicalMaterial color="#bfe3ee" roughness={0.05} transmission={0.85} thickness={0.02} />
          </mesh>
        );
      })}
    </>
  );
}

export default function RoomMesh() {
  const scene = useSceneStore((s) => s.scene);

  const floorShape = useMemo(() => {
    if (scene.walls.length === 0) return null;
    const shape = new THREE.Shape();
    scene.walls.forEach((w, i) => {
      const x = w.start[0] * CM_TO_M;
      const z = w.start[1] * CM_TO_M;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });
    return shape;
  }, [scene.walls]);

  return (
    <group>
      {/* Floor */}
      {floorShape && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <shapeGeometry args={[floorShape]} />
          <meshStandardMaterial color="#c9a876" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Walls */}
      {scene.walls.map((w) => (
        <WallMesh key={w.id} wall={w} openings={scene.openings} />
      ))}

      <DoorWindowFrames openings={scene.openings} walls={scene.walls} />
    </group>
  );
}
