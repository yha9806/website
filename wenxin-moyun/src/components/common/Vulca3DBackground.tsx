import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';

// 品牌色配置
const COLORS = {
  dark: {
    background: '#0a0a0a',
    copper: '#D4915A',
    copperBright: '#E8A66A',
    copperDim: '#A06840',
    slate: '#64748B',
  },
  light: {
    background: '#fafafa',
    copper: '#C87F4A',
    copperBright: '#B06B3A',
    copperDim: '#8B5A3A',
    slate: '#475569',
  }
};

// 鼠标位置追踪 Hook - 带节流优化
function useMousePosition() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const lastUpdateRef = useRef(0);
  const frameIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const THROTTLE_MS = 50; // 50ms 节流 = 20fps 更新

    const handleMouseMove = (e: MouseEvent) => {
      // 更新 ref（始终保持最新）
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };

      // 节流状态更新
      const now = performance.now();
      if (now - lastUpdateRef.current >= THROTTLE_MS) {
        lastUpdateRef.current = now;
        // 使用 requestAnimationFrame 避免布局抖动
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }
        frameIdRef.current = requestAnimationFrame(() => {
          setMouse(mouseRef.current);
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  return mouse;
}

// 生成三角形顶点
function getTrianglePoints(scale: number = 1): [number, number, number][] {
  const h = 1.5 * scale;
  const w = 1.3 * scale;
  return [
    [0, h, 0],
    [-w, -h * 0.5, 0],
    [w, -h * 0.5, 0],
    [0, h, 0], // 闭合
  ];
}

// 生成立方体边框顶点
function getCubeEdges(scale: number = 1): [number, number, number][][] {
  const s = scale * 0.5;
  // 12条边
  return [
    // 前面
    [[-s, -s, s], [s, -s, s]],
    [[s, -s, s], [s, s, s]],
    [[s, s, s], [-s, s, s]],
    [[-s, s, s], [-s, -s, s]],
    // 后面
    [[-s, -s, -s], [s, -s, -s]],
    [[s, -s, -s], [s, s, -s]],
    [[s, s, -s], [-s, s, -s]],
    [[-s, s, -s], [-s, -s, -s]],
    // 连接
    [[-s, -s, s], [-s, -s, -s]],
    [[s, -s, s], [s, -s, -s]],
    [[s, s, s], [s, s, -s]],
    [[-s, s, s], [-s, s, -s]],
  ];
}

// 生成八面体顶点
function getOctahedronEdges(scale: number = 1): [number, number, number][][] {
  const s = scale;
  const vertices: [number, number, number][] = [
    [0, s, 0],   // top
    [0, -s, 0],  // bottom
    [s, 0, 0],   // +x
    [-s, 0, 0],  // -x
    [0, 0, s],   // +z
    [0, 0, -s],  // -z
  ];
  // 12条边
  return [
    [vertices[0], vertices[2]],
    [vertices[0], vertices[3]],
    [vertices[0], vertices[4]],
    [vertices[0], vertices[5]],
    [vertices[1], vertices[2]],
    [vertices[1], vertices[3]],
    [vertices[1], vertices[4]],
    [vertices[1], vertices[5]],
    [vertices[2], vertices[4]],
    [vertices[4], vertices[3]],
    [vertices[3], vertices[5]],
    [vertices[5], vertices[2]],
  ];
}

// 三角形组件 - 使用 drei Line
function WireframeTriangle({
  position,
  scale,
  rotation,
  color,
  speed,
  lineWidth = 3,
  opacity = 0.35,
  mouse
}: {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  color: string;
  speed: number;
  lineWidth?: number;
  opacity?: number;
  mouse: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const baseRotation = useRef({ x: rotation[0], y: rotation[1], z: rotation[2] });

  const points = useMemo(() => getTrianglePoints(scale), [scale]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.x = baseRotation.current.x + t * speed * 0.1 + mouse.y * 0.05;
      groupRef.current.rotation.y = baseRotation.current.y + t * speed * 0.15 + mouse.x * 0.05;
      groupRef.current.rotation.z = baseRotation.current.z + t * speed * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />
    </group>
  );
}

// 立方体组件
function WireframeCube({
  position,
  scale,
  color,
  speed,
  lineWidth = 2.5,
  opacity = 0.30,
  mouse
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  lineWidth?: number;
  opacity?: number;
  mouse: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const edges = useMemo(() => getCubeEdges(scale), [scale]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.x = t * speed * 0.2 + mouse.y * 0.1;
      groupRef.current.rotation.y = t * speed * 0.3 + mouse.x * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  );
}

// 八面体组件
function WireframeOctahedron({
  position,
  scale,
  color,
  speed,
  lineWidth = 2.5,
  opacity = 0.30,
  mouse
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  lineWidth?: number;
  opacity?: number;
  mouse: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const edges = useMemo(() => getOctahedronEdges(scale), [scale]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.x = t * speed * 0.15;
      groupRef.current.rotation.y = t * speed * 0.25 + mouse.x * 0.08;
      groupRef.current.rotation.z = t * speed * 0.1 + mouse.y * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  );
}

// 漂浮的小几何体
function FloatingShape({
  position,
  scale,
  speed,
  type,
  offset,
  color,
  lineWidth = 1.5,
  opacity = 0.25
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
  type: number;
  offset: number;
  color: string;
  lineWidth?: number;
  opacity?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    if (type === 0) {
      return getTrianglePoints(scale);
    } else {
      // 小方块
      const s = scale * 0.5;
      return [
        [-s, -s, 0], [s, -s, 0], [s, s, 0], [-s, s, 0], [-s, -s, 0]
      ] as [number, number, number][];
    }
  }, [scale, type]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * speed + offset) * 0.5;
      groupRef.current.rotation.x = t * speed * 0.3;
      groupRef.current.rotation.y = t * speed * 0.4;
      groupRef.current.rotation.z = t * speed * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />
    </group>
  );
}

// 漂浮的小几何体群
function FloatingShapes({ color, count = 12 }: { color: string; count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.4,
      type: Math.floor(Math.random() * 2),
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} color={color} />
      ))}
    </group>
  );
}

// 相机控制器 - 鼠标视差
function CameraController({ mouse }: { mouse: { x: number; y: number } }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 10));

  useFrame(() => {
    targetPosition.current.x = mouse.x * 0.6;
    targetPosition.current.y = mouse.y * 0.4;

    camera.position.x += (targetPosition.current.x - camera.position.x) * 0.03;
    camera.position.y += (targetPosition.current.y - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// 主场景组件
function Scene({ isDark, mouse, performanceLevel }: { isDark: boolean; mouse: { x: number; y: number }; performanceLevel: 'high' | 'medium' }) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  // 根据性能级别调整漂浮体数量
  const floatingCount = performanceLevel === 'high' ? 15 : 8;

  return (
    <>
      {/* 背景色 */}
      <color attach="background" args={[colors.background]} />

      {/* 相机控制 */}
      <CameraController mouse={mouse} />

      {/* 主要大型几何体 - 基于深度的透明度梯度 */}
      {/* 透明度设计: z=0 → 0.38, z=-1 → 0.32, z=-2 → 0.28, z=-3 → 0.22, z=-4 → 0.18 */}

      {/* 左侧大三角形 (z=-1) */}
      <WireframeTriangle
        position={[-4.5, 0.5, -1]}
        scale={2.5}
        rotation={[0.2, 0, 0.1]}
        color={colors.copper}
        speed={0.4}
        lineWidth={3}
        opacity={0.32}
        mouse={mouse}
      />

      {/* 右上角三角形 (z=-2) */}
      <WireframeTriangle
        position={[4, 2, -2]}
        scale={2}
        rotation={[0.3, 0.5, -0.2]}
        color={colors.copperBright}
        speed={0.35}
        lineWidth={2.5}
        opacity={0.28}
        mouse={mouse}
      />

      {/* 中下方三角形 (z=0) */}
      <WireframeTriangle
        position={[0.5, -2, 0]}
        scale={1.8}
        rotation={[-0.1, 0.2, 0.3]}
        color={colors.copper}
        speed={0.5}
        lineWidth={2.5}
        opacity={0.38}
        mouse={mouse}
      />

      {/* 右侧立方体 (z=-1) */}
      <WireframeCube
        position={[5, -0.5, -1]}
        scale={2.5}
        color={colors.copperDim}
        speed={0.4}
        lineWidth={2.5}
        opacity={0.30}
        mouse={mouse}
      />

      {/* 左下立方体 (z=0) */}
      <WireframeCube
        position={[-3.5, -1.5, 0]}
        scale={2}
        color={colors.slate}
        speed={0.35}
        lineWidth={2}
        opacity={0.35}
        mouse={mouse}
      />

      {/* 中央八面体 (z=0) */}
      <WireframeOctahedron
        position={[1.5, 1, 0]}
        scale={1.5}
        color={colors.copperBright}
        speed={0.3}
        lineWidth={2.5}
        opacity={0.35}
        mouse={mouse}
      />

      {/* 左上八面体 (z=-3) */}
      <WireframeOctahedron
        position={[-2.5, 2.5, -3]}
        scale={1.2}
        color={colors.copper}
        speed={0.4}
        lineWidth={2}
        opacity={0.22}
        mouse={mouse}
      />

      {/* 额外的三角形装饰 (z=-3) */}
      <WireframeTriangle
        position={[-5, -1.5, -3]}
        scale={1.5}
        rotation={[0.5, -0.3, 0.2]}
        color={colors.slate}
        speed={0.25}
        lineWidth={1.5}
        opacity={0.20}
        mouse={mouse}
      />

      {/* 远处三角形 (z=-4) */}
      <WireframeTriangle
        position={[2.5, 3, -4]}
        scale={1.3}
        rotation={[-0.2, 0.4, -0.1]}
        color={colors.copperDim}
        speed={0.3}
        lineWidth={1.5}
        opacity={0.18}
        mouse={mouse}
      />

      {/* 漂浮的小几何体 - 根据性能调整数量 */}
      <FloatingShapes color={colors.copper} count={floatingCount} />
    </>
  );
}

// 性能检测
function useDevicePerformance(): 'high' | 'medium' | 'low' {
  const [level, setLevel] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      setLevel('low');
      return;
    }

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer.includes('Intel') || renderer.includes('Mesa')) {
        setLevel('medium');
      } else {
        setLevel('high');
      }
    }
  }, []);

  return level;
}

// 导出的主组件
export default function Vulca3DBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mouse = useMousePosition();
  const performance = useDevicePerformance();

  // 低性能设备降级为简单背景
  if (performance === 'low') {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 30% 20%, rgba(200, 127, 74, 0.15) 0%, #0a0a0a 50%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(200, 127, 74, 0.08) 0%, #fafafa 50%)',
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 100 }}
        dpr={performance === 'high' ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <Scene isDark={isDark} mouse={mouse} performanceLevel={performance as 'high' | 'medium'} />
      </Canvas>
    </div>
  );
}

// 简化版本 - 用于低性能设备或首屏加载
export function Vulca3DBackgroundSimple() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 -z-10 transition-colors duration-500"
      style={{
        background: isDark
          ? `
            radial-gradient(ellipse at 20% 30%, rgba(200, 127, 74, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(51, 65, 85, 0.15) 0%, transparent 50%),
            #0a0a0a
          `
          : `
            radial-gradient(ellipse at 20% 30%, rgba(200, 127, 74, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(51, 65, 85, 0.08) 0%, transparent 50%),
            #fafafa
          `,
      }}
    />
  );
}
