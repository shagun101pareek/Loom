"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";

export function Scene({ children, ...props }: CanvasProps) {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }} {...props}>
      {children}
    </Canvas>
  );
}
