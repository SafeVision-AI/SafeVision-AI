import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children }: { children: React.ReactNode }) => {
    return children
  }
})

describe('Home Page structural verification', () => {
  it('renders the main heading', () => {
    render(<Page />)
    const heading = screen.getByText(/AI Emergency Navigator/i)
    expect(heading).toBeInTheDocument()
  })

  it('renders the core modules', () => {
    render(<Page />)
    expect(screen.getByText(/Emergency/i)).toBeInTheDocument()
    expect(screen.getByText(/AI Chat/i)).toBeInTheDocument()
  })
})
