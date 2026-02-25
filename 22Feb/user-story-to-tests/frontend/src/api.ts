import { GenerateRequest, GenerateResponse } from './types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

export async function generateTests(
  request: GenerateRequest,
): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      )
    }

    const data: GenerateResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error generating tests:', error)
    throw (error instanceof Error ? error : new Error('Unknown error occurred'))
  }
}

export interface JiraConnectionRequest {
  baseUrl: string
  email: string
  apiKey: string
}

interface JiraConnectionResponse {
  success: boolean
  message?: string
  error?: string
  user?: {
    displayName?: string
    emailAddress?: string
    accountId?: string
  }
}

export async function testJiraConnection(
  request: JiraConnectionRequest,
): Promise<JiraConnectionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/jira/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data: JiraConnectionResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          `Jira connection failed with status ${response.status} ${response.statusText}`,
      )
    }

    return data
  } catch (error) {
    console.error('Error testing Jira connection:', error)
    throw (error instanceof Error ? error : new Error('Unknown error occurred'))
  }
}

export interface JiraStory {
  key: string
  summary: string
  descriptionText: string
}

interface JiraStoriesResponse {
  success: boolean
  issues?: JiraStory[]
  error?: string
}

export async function fetchJiraStories(
  request: JiraConnectionRequest,
): Promise<JiraStory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jira/search-stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data: JiraStoriesResponse = await response.json()

    if (!response.ok || !data.success || !data.issues) {
      throw new Error(
        data.error ||
          `Jira search failed with status ${response.status} ${response.statusText}`,
      )
    }

    return data.issues
  } catch (error) {
    console.error('Error fetching Jira stories:', error)
    throw (error instanceof Error ? error : new Error('Unknown error occurred'))
  }
}

