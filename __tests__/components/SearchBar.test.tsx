import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '@/components/search/SearchBar'

// Mock fetch for suggestions
global.fetch = jest.fn()

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock alert
global.alert = jest.fn()

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn()
  const mockOnLocationSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  const defaultProps = {
    onSearch: mockOnSearch,
    onLocationSearch: mockOnLocationSearch
  }

  describe('Basic Rendering', () => {
    it('should render search input with default placeholder', () => {
      render(<SearchBar {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Search workspaces, cities, or amenities...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<SearchBar {...defaultProps} placeholder="Find coworking spaces" />)
      
      expect(screen.getByPlaceholderText('Find coworking spaces')).toBeInTheDocument()
    })

    it('should render with initial query', () => {
      render(<SearchBar {...defaultProps} initialQuery="New York" />)
      
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<SearchBar {...defaultProps} loading={true} />)
      
      expect(screen.getByText('Searching...')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeDisabled()
      expect(screen.getByRole('button', { name: /searching.../i })).toBeDisabled()
    })

    it('should render location button when onLocationSearch is provided', () => {
      render(<SearchBar {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // MapPin button
    })

    it('should not render location button when onLocationSearch is not provided', () => {
      render(<SearchBar onSearch={mockOnSearch} />)
      
      const buttons = screen.getAllByRole('button')
      // Should only have Filter and Search buttons, no MapPin
      expect(buttons).toHaveLength(2)
    })

    it('should show filter button when showFilters is true (default)', () => {
      render(<SearchBar {...defaultProps} />)
      
      // Filter button should be present (has Filter icon)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // MapPin, Filter, Search
    })

    it('should hide filter button when showFilters is false', () => {
      render(<SearchBar {...defaultProps} showFilters={false} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2) // Only MapPin and Search
    })
  })

  describe('Search Functionality', () => {
    it('should call onSearch when search button is clicked', () => {
      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      fireEvent.change(input, { target: { value: 'coworking' } })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('coworking', { amenities: [] })
    })

    it('should call onSearch when Enter key is pressed', () => {
      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'office space' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
      expect(mockOnSearch).toHaveBeenCalledWith('office space', { amenities: [] })
    })

    it('should hide suggestions when Escape key is pressed', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          suggestions: ['Tech Hub NYC', 'New York']
        })
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // Type to trigger suggestions
      fireEvent.change(input, { target: { value: 'tech' } })
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/search/suggestions?q=tech&limit=8')
      })

      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Tech Hub NYC')).toBeInTheDocument()
      })

      // Press escape to hide suggestions
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByText('Tech Hub NYC')).not.toBeInTheDocument()
      })
    })
  })

  describe('Suggestions', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should fetch and display suggestions after typing', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          suggestions: ['Tech Hub NYC', 'New York', 'High-speed WiFi']
        })
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'tech' } })
      
      // Fast-forward timers to trigger the debounced request
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/search/suggestions?q=tech&limit=8')
      })

      await waitFor(() => {
        expect(screen.getByText('Tech Hub NYC')).toBeInTheDocument()
        expect(screen.getByText('New York')).toBeInTheDocument()
        expect(screen.getByText('High-speed WiFi')).toBeInTheDocument()
      })
    })

    it('should not fetch suggestions for queries less than 2 characters', () => {
      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'a' } })
      
      jest.advanceTimersByTime(300)
      
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle suggestion click', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          suggestions: ['Tech Hub NYC']
        })
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'tech' } })
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(screen.getByText('Tech Hub NYC')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Tech Hub NYC'))
      
      expect(mockOnSearch).toHaveBeenCalledWith('Tech Hub NYC', { amenities: [] })
      expect(screen.getByDisplayValue('Tech Hub NYC')).toBeInTheDocument()
    })

    it('should handle suggestion fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch suggestions:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should show suggestions with correct types and icons', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          suggestions: ['This is a very long workspace name that should be detected as workspace', 'WiFi', 'NYC']
        })
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(screen.getByText('workspace')).toBeInTheDocument()
        expect(screen.getByText('amenity')).toBeInTheDocument()
        expect(screen.getByText('city')).toBeInTheDocument()
      })
    })
  })

  describe('Location Search', () => {
    it('should request geolocation when location button is clicked', () => {
      render(<SearchBar {...defaultProps} />)
      
      const locationButton = screen.getAllByRole('button')[0] // First button is location
      
      fireEvent.click(locationButton)
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
    })

    it('should handle geolocation success', () => {
      render(<SearchBar {...defaultProps} />)
      
      const locationButton = screen.getAllByRole('button')[0]
      
      // Mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        })
      })
      
      fireEvent.click(locationButton)
      
      expect(mockOnLocationSearch).toHaveBeenCalledWith(40.7128, -74.0060, 25)
    })

    it('should handle geolocation error', () => {
      render(<SearchBar {...defaultProps} />)
      
      const locationButton = screen.getAllByRole('button')[0]
      
      // Mock geolocation error
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(new Error('Permission denied'))
      })
      
      fireEvent.click(locationButton)
      
      expect(global.alert).toHaveBeenCalledWith('Unable to get your location. Please enable location services.')
    })

    it('should handle when geolocation is not supported', () => {
      // Temporarily remove geolocation support
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      })

      render(<SearchBar {...defaultProps} />)
      
      const locationButton = screen.getAllByRole('button')[0]
      
      fireEvent.click(locationButton)
      
      expect(global.alert).toHaveBeenCalledWith('Geolocation is not supported by this browser.')

      // Restore geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      })
    })
  })

  describe('Filter Functionality', () => {
    it('should open filter popover when filter button is clicked', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1] // Second button is filter
      
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
    })

    it('should update city filter', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
      
      const cityInput = screen.getByPlaceholderText('Enter city name')
      fireEvent.change(cityInput, { target: { value: 'San Francisco' } })
      
      // Close popover and search
      fireEvent.click(document.body)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('', {
        amenities: [],
        city: 'San Francisco'
      })
    })

    it('should update amenities filter', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByText('High-speed WiFi')).toBeInTheDocument()
      })
      
      const wifiCheckbox = screen.getByRole('checkbox', { name: /high-speed wifi/i })
      fireEvent.click(wifiCheckbox)
      
      const coffeeCheckbox = screen.getByRole('checkbox', { name: /coffee & tea/i })
      fireEvent.click(coffeeCheckbox)
      
      // Close popover and search
      fireEvent.click(document.body)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('', {
        amenities: ['High-speed WiFi', 'Coffee & Tea'],
        city: undefined
      })
    })

    it('should update price range filters', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('$0')).toBeInTheDocument()
      })
      
      const minPriceInput = screen.getByPlaceholderText('$0')
      const maxPriceInput = screen.getByPlaceholderText('$1000')
      
      fireEvent.change(minPriceInput, { target: { value: '50' } })
      fireEvent.change(maxPriceInput, { target: { value: '150' } })
      
      // Close popover and search
      fireEvent.click(document.body)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('', {
        amenities: [],
        city: undefined,
        minPrice: 50,
        maxPrice: 150
      })
    })

    it('should update rating filter', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
      })
      
      const ratingSelect = screen.getByRole('combobox')
      fireEvent.change(ratingSelect, { target: { value: '4.5' } })
      
      // Close popover and search
      fireEvent.click(document.body)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('', {
        amenities: [],
        city: undefined,
        minRating: 4.5
      })
    })

    it('should update verified filter', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /verified workspaces only/i })).toBeInTheDocument()
      })
      
      const verifiedCheckbox = screen.getByRole('checkbox', { name: /verified workspaces only/i })
      fireEvent.click(verifiedCheckbox)
      
      // Close popover and search
      fireEvent.click(document.body)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith('', {
        amenities: [],
        city: undefined,
        isVerified: true
      })
    })

    it('should show filter badge with count when filters are active', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      // Add multiple filters
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByPlaceholderText('Enter city name'), { target: { value: 'NYC' } })
      fireEvent.click(screen.getByRole('checkbox', { name: /high-speed wifi/i }))
      fireEvent.click(screen.getByRole('checkbox', { name: /coffee & tea/i }))
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '4.0' } })
      
      // Close popover
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument() // Badge count: city + 2 amenities + rating
      })
    })
  })

  describe('Active Filters Display', () => {
    it('should display active filters as badges', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
      
      // Add filters
      fireEvent.change(screen.getByPlaceholderText('Enter city name'), { target: { value: 'London' } })
      fireEvent.click(screen.getByRole('checkbox', { name: /high-speed wifi/i }))
      
      // Close popover
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument()
        expect(screen.getByText('High-speed WiFi')).toBeInTheDocument()
      })
    })

    it('should remove individual filters when X button is clicked', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
      
      // Add city filter
      fireEvent.change(screen.getByPlaceholderText('Enter city name'), { target: { value: 'Tokyo' } })
      
      // Close popover
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Tokyo')).toBeInTheDocument()
      })
      
      // Find and click the X button in the Tokyo badge
      const tokyoBadge = screen.getByText('Tokyo').closest('span')
      const removeButton = tokyoBadge?.querySelector('button')
      expect(removeButton).toBeInTheDocument()
      
      fireEvent.click(removeButton!)
      
      await waitFor(() => {
        expect(screen.queryByText('Tokyo')).not.toBeInTheDocument()
      })
    })

    it('should clear all filters when Clear All button is clicked', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const filterButton = screen.getAllByRole('button')[1]
      fireEvent.click(filterButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument()
      })
      
      // Add multiple filters
      fireEvent.change(screen.getByPlaceholderText('Enter city name'), { target: { value: 'Berlin' } })
      fireEvent.click(screen.getByRole('checkbox', { name: /high-speed wifi/i }))
      
      // Close popover
      fireEvent.click(document.body)
      
      await waitFor(() => {
        expect(screen.getByText('Berlin')).toBeInTheDocument()
        expect(screen.getByText('High-speed WiFi')).toBeInTheDocument()
      })
      
      // Click Clear All
      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      fireEvent.click(clearAllButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Berlin')).not.toBeInTheDocument()
        expect(screen.queryByText('High-speed WiFi')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty suggestion response', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          suggestions: []
        })
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'xyz' } })
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/search/suggestions?q=xyz&limit=8')
      })

      // Should not show any suggestions
      expect(screen.queryByText('workspace')).not.toBeInTheDocument()
    })

    it('should handle API error response', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })

      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test' } })
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('should debounce API calls when typing quickly', async () => {
      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // Type multiple characters quickly
      fireEvent.change(input, { target: { value: 't' } })
      fireEvent.change(input, { target: { value: 'te' } })
      fireEvent.change(input, { target: { value: 'tech' } })
      
      // Only advance by 150ms (less than 300ms debounce)
      jest.advanceTimersByTime(150)
      expect(fetch).not.toHaveBeenCalled()
      
      // Complete the debounce period
      jest.advanceTimersByTime(150)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith('/api/search/suggestions?q=tech&limit=8')
      })
    })

    it('should handle special characters in search query', () => {
      render(<SearchBar {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      const specialQuery = 'café & co-working (24/7)'
      fireEvent.change(input, { target: { value: specialQuery } })
      fireEvent.click(searchButton)
      
      expect(mockOnSearch).toHaveBeenCalledWith(specialQuery, { amenities: [] })
    })
  })
})