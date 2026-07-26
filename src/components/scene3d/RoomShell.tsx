"use client";
import type { RoomSchema } from "../../types/room";

export default function RoomShell({ room }: { room: RoomSchema["room"] }) {
  const { width, depth, height, wallThickness: t } = room;

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#7c8a80" roughness={0.95} />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, t]} />
        <meshStandardMaterial color="#d9d9dd" roughness={0.8} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, t]} />
        <meshStandardMaterial color="#d9d9dd" roughness={0.8} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, height, depth]} />
        <meshStandardMaterial color="#d9d9dd" roughness={0.8} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, height, depth]} />
        <meshStandardMaterial color="#d9d9dd" roughness={0.8} />
      </mesh>
      <mesh position={[0, height, 0]} receiveShadow>
        <boxGeometry args={[width, t, depth]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
    </group>
  );
}
