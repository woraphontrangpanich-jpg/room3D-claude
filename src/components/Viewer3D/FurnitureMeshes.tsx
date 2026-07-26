import { useSceneStore } from "../../store/sceneStore";
import { getCatalogEntry } from "../../data/furnitureCatalog";
import FurnitureShape from "./FurnitureShape";

const CM_TO_M = 0.01;

export default function FurnitureMeshes() {
  const furniture = useSceneStore((s) => s.scene.furniture);

  return (
    <>
      {furniture.map((f) => {
        const entry = getCatalogEntry(f.catalogId);
        const shapeType = entry?.shapeType ?? "generic-box";
        return (
          <group
            key={f.id}
            position={[f.position[0] * CM_TO_M, 0, f.position[1] * CM_TO_M]}
            rotation={[0, -(f.rotationDeg * Math.PI) / 180, 0]}
          >
            <FurnitureShape
              shapeType={shapeType}
              w={f.footprint[0] * CM_TO_M}
              d={f.footprint[1] * CM_TO_M}
              h={f.heightCm * CM_TO_M}
              color={f.color}
            />
          </group>
        );
      })}
    </>
  );
}
