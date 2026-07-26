import { Suspense, useEffect, useState } from "react";
import { useSceneStore } from "../../store/sceneStore";
import { getModelUrl, hasModel, setAvailableModelIds } from "../../data/furnitureCatalog";
import FurnitureModel from "./FurnitureModel";
import type { FurnitureItem } from "../../types/scene";

const CM_TO_M = 0.01;

function PlaceholderBox({ f }: { f: FurnitureItem }) {
  return (
    <mesh
      position={[f.position[0] * CM_TO_M, (f.heightCm / 2) * CM_TO_M, f.position[1] * CM_TO_M]}
      rotation={[0, -(f.rotationDeg * Math.PI) / 180, 0]}
      scale={[f.flippedX ? -1 : 1, 1, 1]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[f.footprint[0] * CM_TO_M, f.heightCm * CM_TO_M, f.footprint[1] * CM_TO_M]} />
      <meshStandardMaterial color={f.color} roughness={0.7} metalness={0.05} />
    </mesh>
  );
}

export default function FurnitureMeshes() {
  const furniture = useSceneStore((s) => s.scene.furniture);
  const [manifestLoaded, setManifestLoaded] = useState(false);

  useEffect(() => {
    fetch("/models/manifest.json")
      .then((r) => (r.ok ? r.json() : { available: [] }))
      .then((data) => setAvailableModelIds(Array.isArray(data.available) ? data.available : []))
      .catch(() => setAvailableModelIds([]))
      .finally(() => setManifestLoaded(true));
  }, []);

  return (
    <>
      {furniture.map((f) => {
        const fallback = <PlaceholderBox key={f.id} f={f} />;
        if (!manifestLoaded || !hasModel(f.catalogId)) {
          return fallback;
        }
        return (
          <Suspense key={f.id} fallback={fallback}>
            <FurnitureModel url={getModelUrl(f.catalogId)!} item={f} fallback={fallback} />
          </Suspense>
        );
      })}
    </>
  );
}
