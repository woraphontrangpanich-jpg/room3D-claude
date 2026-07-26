"use client";
import type { ReactElement } from "react";
import type { FurnitureItem } from "../../types/room";

const woodColor = "#a9764f";
const darkWoodColor = "#3e2a1c";
const fabricColor = "#d8cdbd";
const metalColor = "#2b2b2e";
const whiteColor = "#f4f1ea";

const woodProps = { roughness: 0.45, metalness: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.4 } as const;
const darkWoodProps = { roughness: 0.4, metalness: 0.02, clearcoat: 0.2, clearcoatRoughness: 0.35 } as const;
const fabricProps = { roughness: 0.9, metalness: 0 } as const;
const metalProps = { roughness: 0.35, metalness: 0.85 } as const;
const whiteProps = { roughness: 0.55, metalness: 0.02 } as const;

function Bed() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.3, 2.0]} />
        <meshStandardMaterial color={woodColor} {...woodProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.7, 0.7]}>
        <boxGeometry args={[1.6, 0.7, 0.2]} />
        <meshStandardMaterial color={fabricColor} {...fabricProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.7, -0.7]}>
        <boxGeometry args={[1.6, 0.7, 0.2]} />
        <meshStandardMaterial color={fabricColor} {...fabricProps} />
      </mesh>
    </group>
  );
}

function Desk() {
  const legs: [number, number][] = [[-0.55, -0.27], [0.55, -0.27], [-0.55, 0.27], [0.55, 0.27]];
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.6]} />
        <meshStandardMaterial color={woodColor} {...woodProps} />
      </mesh>
      {legs.map(([x, z]) => (
        <mesh key={`${x}-${z}`} castShadow receiveShadow position={[x, 0.25, z]}>
          <boxGeometry args={[0.06, 0.5, 0.06]} />
          <meshStandardMaterial color={darkWoodColor} {...darkWoodProps} />
        </mesh>
      ))}
    </group>
  );
}

function Chair() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={woodColor} {...woodProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.3, -0.22]}>
        <boxGeometry args={[0.5, 0.55, 0.06]} />
        <meshStandardMaterial color={darkWoodColor} {...darkWoodProps} />
      </mesh>
    </group>
  );
}

function Wardrobe() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.8, 2, 0.45]} />
        <meshStandardMaterial color={darkWoodColor} {...darkWoodProps} />
      </mesh>
    </group>
  );
}

function Sofa() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.3, 0.45, 0.7]} />
        <meshStandardMaterial color={fabricColor} {...fabricProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.45, -0.35]}>
        <boxGeometry args={[1.3, 0.45, 0.1]} />
        <meshStandardMaterial color={fabricColor} {...fabricProps} />
      </mesh>
    </group>
  );
}

function CoffeeTable() {
  const legs: [number, number][] = [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]];
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.55]} />
        <meshStandardMaterial color={woodColor} {...woodProps} />
      </mesh>
      {legs.map(([x, z]) => (
        <mesh key={`${x}-${z}`} castShadow receiveShadow position={[x, 0.12, z]}>
          <boxGeometry args={[0.06, 0.24, 0.06]} />
          <meshStandardMaterial color={darkWoodColor} {...darkWoodProps} />
        </mesh>
      ))}
    </group>
  );
}

function Bookshelf() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 2.0, 0.6]} />
        <meshStandardMaterial color={darkWoodColor} {...darkWoodProps} />
      </mesh>
    </group>
  );
}

function AcUnit() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.6, 0.4, 0.45]} />
      <meshStandardMaterial color={metalColor} {...metalProps} />
    </mesh>
  );
}

function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[1.3, 1.3]} />
      <meshStandardMaterial color={whiteColor} {...whiteProps} />
    </mesh>
  );
}

const componentMap: Record<FurnitureItem["type"], () => ReactElement> = {
  bed: Bed,
  desk: Desk,
  chair: Chair,
  wardrobe: Wardrobe,
  sofa: Sofa,
  coffeeTable: CoffeeTable,
  bookshelf: Bookshelf,
  acUnit: AcUnit,
  rug: Rug,
};

export default function Furniture({ item }: { item: FurnitureItem }) {
  const Comp = componentMap[item.type];
  return (
    <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]} scale={item.scale}>
      <Comp />
    </group>
  );
}
