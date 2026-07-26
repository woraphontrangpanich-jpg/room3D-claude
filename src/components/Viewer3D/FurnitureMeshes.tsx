import { useSceneStore } from "../../store/sceneStore";

const CM_TO_M = 0.01;

export default function FurnitureMeshes() {
  const furniture = useSceneStore((s) => s.scene.furniture);

  return (
    <>
      {furniture.map((f) => (
        <mesh
          key={f.id}
          position={[f.position[0] * CM_TO_M, (f.heightCm / 2) * CM_TO_M, f.position[1] * CM_TO_M]}
          rotation={[0, -(f.rotationDeg * Math.PI) / 180, 0]}
          scale={[f.flippedX ? -1 : 1, 1, 1]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[f.footprint[0] * CM_TO_M, f.heightCm * CM_TO_M, f.footprint[1] * CM_TO_M]} />
          <meshStandardMaterial color={f.color} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
    </>
  );
}
