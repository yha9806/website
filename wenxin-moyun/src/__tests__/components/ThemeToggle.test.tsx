import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock the useTheme hook
const mockToggleTheme = vi.fn()
const mockSetTheme = vi.fn()
let mockTheme: 'light' | 'dark' = 'light'

vi.mock('../../contexts/useTheme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
    setTheme: mockSetTheme,
  }),
}))

// Mock framer-motion matching the project convention (see IOSToggle.test.tsx)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileTap, transition, animate, initial, ...domProps } = props
      return <div {...domProps}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { whileTap, whileHover, transition, animate, initial, ...domProps } = props
      return <button {...domProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock iOS animations utility
vi.mock('../../components/ios/utils/animations', () => ({
  iosAnimations: {
    spring: { type: 'spring', stiffness: 400, damping: 30 },
  },
}))

import ThemeToggle, { ThemeToggleWithLabel, ThemeSwitch, HeaderControls } from '../../components/common/ThemeToggle'

describe('ThemeToggle (default)', () => {
  beforeEach(() => {
    mockTheme = 'light'
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    const { container } = render(<ThemeToggle />)
    // IOSToggle renders as a div wrapper, not a button
    expect(container.firstChild).toBeTruthy()
  })

  it('should render Sun and Moon icons', () => {
    render(<ThemeToggle />)
    // lucide-react renders SVGs; ThemeToggle provides leftIcon (Sun) and rightIcon (Moon)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(2)
  })

  it('should apply primary color when checked (dark theme)', () => {
    mockTheme = 'dark'
    const { container } = render(<ThemeToggle />)
    // IOSToggle with color="primary" and checked=true renders bg-slate-600
    expect(container.querySelector('.bg-slate-600')).toBeTruthy()
  })

  it('should apply unchecked color for light theme', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeToggle />)
    // Unchecked state uses bg-gray-300
    expect(container.querySelector('.bg-gray-300')).toBeTruthy()
  })

  it('should call toggleTheme when clicked', () => {
    const { container } = render(<ThemeToggle />)
    // Click the outermost wrapper (motion.div rendered as div)
    fireEvent.click(container.firstChild as HTMLElement)
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })
})

describe('ThemeToggleWithLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with Light label in light mode', () => {
    mockTheme = 'light'
    render(<ThemeToggleWithLabel />)
    expect(screen.getByText('Light')).toBeInTheDocument()
  })

  it('should render with Dark label in dark mode', () => {
    mockTheme = 'dark'
    render(<ThemeToggleWithLabel />)
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('should not show Dark label in light mode', () => {
    mockTheme = 'light'
    render(<ThemeToggleWithLabel />)
    expect(screen.queryByText('Dark')).not.toBeInTheDocument()
  })

  it('should not show Light label in dark mode', () => {
    mockTheme = 'dark'
    render(<ThemeToggleWithLabel />)
    expect(screen.queryByText('Light')).not.toBeInTheDocument()
  })

  it('should call toggleTheme on click', () => {
    mockTheme = 'light'
    render(<ThemeToggleWithLabel />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })

  it('should render as a button element', () => {
    mockTheme = 'light'
    render(<ThemeToggleWithLabel />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render an SVG icon', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeToggleWithLabel />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('should have appropriate styling classes', () => {
    mockTheme = 'light'
    render(<ThemeToggleWithLabel />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('rounded-lg')
    expect(button.className).toContain('flex')
    expect(button.className).toContain('items-center')
  })

  it('should have dark mode border classes', () => {
    mockTheme = 'dark'
    render(<ThemeToggleWithLabel />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('dark:border-gray-700')
  })
})

describe('ThemeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeSwitch />)
    expect(container.firstChild).toBeTruthy()
  })

  it('should apply checked color for dark theme', () => {
    mockTheme = 'dark'
    const { container } = render(<ThemeSwitch />)
    // primary color checked = bg-slate-600
    expect(container.querySelector('.bg-slate-600')).toBeTruthy()
  })

  it('should apply unchecked color for light theme', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeSwitch />)
    expect(container.querySelector('.bg-gray-300')).toBeTruthy()
  })

  it('should call toggleTheme when clicked', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeSwitch />)
    fireEvent.click(container.firstChild as HTMLElement)
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })

  it('should use sm size', () => {
    mockTheme = 'light'
    const { container } = render(<ThemeSwitch />)
    // sm size track: w-10 h-6
    expect(container.querySelector('.w-10')).toBeTruthy()
    expect(container.querySelector('.h-6')).toBeTruthy()
  })
})

describe('HeaderControls', () => {
  beforeEach(() => {
    mockTheme = 'light'
    vi.clearAllMocks()
  })

  it('should render a container with ThemeToggle inside', () => {
    const { container } = render(<HeaderControls />)
    // The wrapper div should exist
    expect(container.firstChild).toBeTruthy()
    // Should contain toggle content (IOSToggle renders nested divs)
    expect(container.querySelector('.rounded-full')).toBeTruthy()
  })

  it('should have flex layout classes', () => {
    const { container } = render(<HeaderControls />)
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('flex')
    expect(wrapper?.className).toContain('items-center')
  })

  it('should have gap spacing', () => {
    const { container } = render(<HeaderControls />)
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('gap-2')
  })
})
