import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUpvoted', () => {
    it('should call the correct endpoint with correct parameters', async () => {
      const { usersApi } = await import('../services/api')

      // Mock the request function
      const mockRequest = vi.fn().mockResolvedValue({
        data: {
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            data: [
              { id: 1, title: 'Post 1' },
              { id: 2, title: 'Post 2' },
            ],
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      })

      // Replace the request function temporarily
      const api = (await import('../services/api')).default
      vi.spyOn(api, 'request' as any).mockImplementation(mockRequest)

      const result = await usersApi.getUpvoted(1, 1, 10)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users/1/upvoted',
        params: { page: 1, limit: 10 },
      })

      expect(result).toEqual({
        data: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })
  })

  describe('getDownvoted', () => {
    it('should call the correct endpoint with correct parameters', async () => {
      const { usersApi } = await import('../services/api')

      const mockRequest = vi.fn().mockResolvedValue({
        data: {
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            data: [
              { id: 3, title: 'Post 3' },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      })

      const api = (await import('../services/api')).default
      vi.spyOn(api, 'request' as any).mockImplementation(mockRequest)

      const result = await usersApi.getDownvoted(1, 1, 10)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users/1/downvoted',
        params: { page: 1, limit: 10 },
      })

      expect(result).toEqual({
        data: [
          { id: 3, title: 'Post 3' },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })
  })

  describe('getPosts', () => {
    it('should call the correct endpoint with correct parameters', async () => {
      const { usersApi } = await import('../services/api')

      const mockRequest = vi.fn().mockResolvedValue({
        data: {
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            data: [
              { id: 1, title: 'My Post' },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      })

      const api = (await import('../services/api')).default
      vi.spyOn(api, 'request' as any).mockImplementation(mockRequest)

      const result = await usersApi.getPosts(1, 1, 10)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users/1/posts',
        params: { page: 1, limit: 10 },
      })

      expect(result).toEqual({
        data: [
          { id: 1, title: 'My Post' },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })
  })

  describe('getComments', () => {
    it('should call the correct endpoint with correct parameters', async () => {
      const { usersApi } = await import('../services/api')

      const mockRequest = vi.fn().mockResolvedValue({
        data: {
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            data: [
              { id: 1, content: 'My comment' },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      })

      const api = (await import('../services/api')).default
      vi.spyOn(api, 'request' as any).mockImplementation(mockRequest)

      const result = await usersApi.getComments(1, 1, 10)

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users/1/comments',
        params: { page: 1, limit: 10 },
      })

      expect(result).toEqual({
        data: [
          { id: 1, content: 'My comment' },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    })
  })
})


