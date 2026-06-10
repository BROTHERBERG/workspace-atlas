import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Mock providers for testing
const MockProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: MockProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Simple test to satisfy Jest requirement
describe('Test Utils', () => {
  it('should export custom render function', () => {
    expect(customRender).toBeDefined()
    expect(typeof customRender).toBe('function')
  })
})