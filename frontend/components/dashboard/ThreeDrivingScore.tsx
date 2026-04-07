'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Text } from '@react-three/drei';
import * as THREE from 'three';

function ScoreRing({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotate slowly over time
  useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * -0.5;
      // Slight floating motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  // Calculate arc length based on score (0 to 100) -> (0 to PI * 2)
  const arcLight = (score / 100) * Math.PI * 2;
  
  // Color logic
  const color = score > 80 ? '#53e16f' : score > 50 ? '#ffb4aa' : '#ff5545';

  return (
    <group>
      {/* Background track ring */}
      <Torus args={[1.2, 0.15, 16, 64]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#2a3548" opacity={0.3} transparent />
      </Torus>
      
      {/* Active score ring */}
      <Torus 
        ref={meshRef} 
        args={[1.2, 0.16, 16, 64, arcLight]} 
        rotation={[0, 0, Math.PI / 2]} // Starts from top
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </Torus>
    </group>
  );
}

export default function ThreeDrivingScore({ score = 78 }: { score?: number }) {
  return (
    <div className="w-[72px] h-[72px] pointer-events-auto bg-white/80 dark:bg-[#1a2133]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-full relative group select-none overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <ScoreRing score={score} />
        </Canvas>
      </div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <span className="text-xl font-black text-slate-800 dark:text-[#d7e3fc] leading-none drop-shadow-md">{score}</span>
        <span className="text-[7px] font-bold text-slate-500 dark:text-[#c5c6cd] uppercase tracking-wider">Safe</span>
      </div>
    </div>
  );
}
