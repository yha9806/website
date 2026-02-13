/**
 * StaticBackground - 静态CSS背景组件
 * 用作3D背景的fallback，不依赖任何Three.js库
 * 在CI构建环境中可以确保构建成功
 */
import { useTheme } from '../../contexts/useTheme';

export default function StaticBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
