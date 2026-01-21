# VULCA 视觉设计需求文档

**版本**: v1.0
**日期**: 2026-01-14
**参考**: Scale AI (scale.com)

---

## 一、当前状态分析

### 1.1 已完成

| 组件 | 状态 | 问题 |
|------|------|------|
| VulcaLogo | 初版完成 | 3D效果过于简单，缺乏高端感 |
| GeometricBackground | 初版完成 | 动效过于平面，缺乏真实的3D深度 |
| 配色系统 | 完成 | 暖铜色调符合艺术定位 |
| 深色/亮色模式 | 完成 | 切换正常 |

### 1.2 核心问题

1. **Logo 设计感不足**
   - 当前：简单的 V 形棱镜 SVG
   - 问题：缺乏品牌辨识度，不够"极致"
   - 参考：Scale AI 的 logo 是纯文字，但背景动效极其精致

2. **背景动效不够震撼**
   - 当前：2D SVG 形状 + Framer Motion 位移/旋转
   - 问题：没有真正的 3D 渲染效果，没有液体/流体物理模拟
   - 参考：Scale AI 使用 WebGL/Three.js 实现真正的 3D 效果

3. **缺乏视觉焦点**
   - 当前：背景元素分散在四周
   - 问题：没有形成视觉引导，用户注意力分散

---

## 二、Scale AI 设计分析

### 2.1 核心视觉特征

```
┌─────────────────────────────────────────────────────────────┐
│                    Scale AI 首页结构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Logo: scale]              导航              [Book Demo]   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│          ┌─────────────────────────────────┐                │
│          │                                 │                │
│          │    ████  3D 几何动效区域  ████   │  ← WebGL 渲染 │
│          │    ████  (旋转立方体/箭头) ████   │                │
│          │                                 │                │
│          └─────────────────────────────────┘                │
│                                                             │
│     "Breakthrough AI from Data to Deployment"               │
│                                                             │
│     Scale delivers proven data, evaluations...              │
│                                                             │
│        [Book a Demo →]    [Build AI →]                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│     Generative AI Companies | Government | Enterprises      │
│     [Meta] [Cohere] [Adept] [Character AI]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术实现分析

| 特征 | Scale AI 实现 | 当前 VULCA 实现 | 差距 |
|------|--------------|----------------|------|
| 3D 渲染 | WebGL + Three.js | SVG + CSS Transform | 巨大 |
| 几何形状 | 真实 3D 网格模型 | 2D SVG 路径 | 巨大 |
| 光照效果 | 实时光照计算 | 静态渐变 | 巨大 |
| 动画帧率 | 60fps GPU 加速 | Framer Motion | 中等 |
| 交互响应 | 鼠标跟随视差 | 无 | 巨大 |
| 液体效果 | 物理模拟/Shader | SVG feTurbulence | 巨大 |

### 2.3 Scale AI 关键设计元素

1. **3D 几何体**
   - 悬浮的立方体框架（wireframe）
   - 带有金属质感的箭头/三角形
   - 实时旋转 + 光照反射

2. **渐变光晕**
   - 紫色/蓝色/橙色的柔和光晕
   - 光晕随形状移动

3. **深色背景**
   - 纯黑或深灰 (#0a0a0a)
   - 微妙的噪点纹理

4. **Logo 设计**
   - 纯文字 "scale"（小写）
   - 无图标，依靠背景动效建立品牌感

---

## 三、设计方案选项

### 方案 A：CSS/SVG 增强版（当前方向）

**优点**：
- 无需引入新依赖
- 包体积小
- 兼容性好

**缺点**：
- 无法实现真正的 3D 效果
- 视觉上限较低

**适合场景**：
- 快速迭代
- 对视觉要求不极致

**改进方向**：
1. 优化 SVG 渐变和滤镜
2. 增加更多层次的伪 3D 效果
3. 添加鼠标跟随视差

---

### 方案 B：Three.js 全 3D 实现

**优点**：
- 真正的 3D 渲染
- 可实现 Scale AI 级别效果
- GPU 加速，性能好

**缺点**：
- 增加 ~500KB 包体积
- 需要 WebGL 支持
- 开发周期长

**适合场景**：
- 追求极致视觉
- 品牌展示优先

**实现内容**：
1. 3D 场景设置（Scene, Camera, Renderer）
2. 几何体模型（立方体框架、三角形、箭头）
3. 材质与光照（MeshStandardMaterial, AmbientLight, PointLight）
4. 动画循环（requestAnimationFrame）
5. 鼠标交互（视差效果）
6. 响应式适配

---

### 方案 C：React Three Fiber（推荐）

**优点**：
- React 生态整合好
- 声明式 API
- 社区活跃

**缺点**：
- 同样增加包体积
- 学习曲线

**依赖**：
```json
{
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "three": "^0.160.x"
}
```

---

### 方案 D：Lottie/Rive 动画

**优点**：
- 设计师友好
- 包体积可控
- 矢量动画流畅

**缺点**：
- 不是真正的 3D
- 需要设计资源

---

## 四、Logo 设计方案

### 4.1 当前 Logo 问题

```
当前设计：
┌─────────┐
│   /\    │  V 形棱镜
│  /  \   │  问题：过于简单，缺乏品牌记忆点
│ /____\  │
└─────────┘
```

### 4.2 Logo 改进方向

**方向 A：极简文字 Logo（Scale AI 风格）**
```
VULCA
```
- 纯文字，无图标
- 依靠背景动效建立品牌感
- 字体：SF Pro Display 或自定义

**方向 B：抽象符号 + 文字**
```
[符号] VULCA
```
符号选项：
1. 视角交汇点（代表多元文化视角）
2. 棱镜/光谱（代表文化分析）
3. 框架/画框（代表艺术评估）

**方向 C：动态 Logo**
- Logo 本身带有微动效
- 悬停时有变化

### 4.3 推荐方案

采用 **方向 A（极简文字）+ 强大背景动效** 的组合：
- Logo 简洁有力
- 背景动效建立视觉记忆
- 与 Scale AI 策略一致

---

## 五、背景动效详细需求

### 5.1 核心动效元素

| 元素 | 描述 | 优先级 |
|------|------|--------|
| 3D 旋转立方体框架 | 线框立方体，缓慢旋转 | P0 |
| 3D 箭头/三角形 | 指向性几何体 | P0 |
| 渐变光晕 | 跟随几何体移动的光晕 | P1 |
| 粒子效果 | 微小粒子漂浮 | P2 |
| 鼠标视差 | 鼠标移动影响视角 | P1 |

### 5.2 技术规格

```typescript
interface BackgroundConfig {
  // 3D 场景
  scene: {
    background: '#0a0a0a' | 'transparent';
    fog: boolean;
  };

  // 相机
  camera: {
    fov: 75;
    near: 0.1;
    far: 1000;
    position: [0, 0, 5];
  };

  // 几何体
  geometries: {
    cube: {
      type: 'wireframe';
      size: 2;
      rotation: { x: 0.001, y: 0.002 };
      material: 'MeshBasicMaterial';
      color: '#C87F4A'; // 暖铜色
    };
    triangle: {
      type: 'filled';
      size: 1.5;
      position: [2, 1, -1];
      rotation: { y: 0.001 };
      material: 'MeshStandardMaterial';
      color: '#334155'; // 墨石灰
    };
  };

  // 光照
  lights: {
    ambient: { intensity: 0.5 };
    point: [
      { position: [5, 5, 5], intensity: 1, color: '#C87F4A' },
      { position: [-5, -5, 5], intensity: 0.5, color: '#334155' }
    ];
  };

  // 交互
  interaction: {
    mouseParallax: true;
    parallaxIntensity: 0.05;
  };
}
```

### 5.3 性能要求

| 指标 | 目标 |
|------|------|
| 帧率 | 60fps |
| GPU 使用率 | < 30% |
| 内存占用 | < 100MB |
| 首次加载 | < 3s |
| 低端设备降级 | 自动检测 |

---

## 六、实施计划

### 阶段 1：技术选型确认
- [ ] 确认使用 Three.js / React Three Fiber / CSS 增强
- [ ] 评估包体积影响
- [ ] 确认浏览器兼容性要求

### 阶段 2：Logo 定稿
- [ ] 确认 Logo 设计方向
- [ ] 如有图形元素，完成 SVG 设计
- [ ] 确认各尺寸展示效果

### 阶段 3：背景动效开发
- [ ] 搭建 3D 场景基础
- [ ] 实现核心几何体
- [ ] 添加光照和材质
- [ ] 实现动画循环
- [ ] 添加鼠标交互
- [ ] 性能优化

### 阶段 4：集成测试
- [ ] 与现有页面集成
- [ ] 深色/亮色模式测试
- [ ] 移动端适配
- [ ] 性能测试

---

## 七、待确认事项

请在以下选项中做出选择：

### Q1: 技术方案选择
- [ ] A. CSS/SVG 增强版（快速、轻量）
- [ ] B. Three.js 原生（最灵活）
- [ ] C. React Three Fiber（React 友好，推荐）
- [ ] D. Lottie/Rive（需设计资源）

### Q2: Logo 设计方向
- [ ] A. 纯文字 "VULCA"（Scale AI 风格）
- [ ] B. 保留当前 V 形棱镜 + 优化
- [ ] C. 全新设计（需提供设计稿）

### Q3: 视觉优先级
- [ ] A. 追求极致效果，接受更长开发周期
- [ ] B. 平衡效果与效率，适度优化
- [ ] C. 保持当前效果，专注功能

### Q4: 性能权衡
- [ ] A. 优先视觉效果，接受更大包体积（+500KB）
- [ ] B. 平衡考虑，使用懒加载
- [ ] C. 优先性能，使用轻量方案

---

## 八、参考资源

### Scale AI 技术分析
- 使用 WebGL 进行 3D 渲染
- 自定义 Shader 实现光照效果
- 鼠标跟随视差交互

### 推荐学习资源
- [Three.js Journey](https://threejs-journey.com/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [Drei 组件库](https://github.com/pmndrs/drei)

### 类似效果案例
- [Linear.app](https://linear.app) - 极简 + 3D 动效
- [Stripe.com](https://stripe.com) - 渐变 + 微动效
- [Vercel.com](https://vercel.com) - 深色 + 几何

---

**文档结束**

请根据以上选项提供您的决策，我将据此制定具体实施方案。
