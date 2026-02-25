import { useState } from 'react'
import { testJiraConnection, fetchJiraStories } from '../api'
import type { JiraStory } from '../api'

interface JiraPanelProps {
  onStorySelected: (summary: string, descriptionText: string) => void
}

export function JiraPanel({ onStorySelected }: JiraPanelProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [stories, setStories] = useState<JiraStory[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [storiesError, setStoriesError] = useState<string | null>(null)
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null)

  const handleStorySelect = (story: JiraStory) => {
    setSelectedIssueKey(story.key)
    onStorySelected(story.summary, story.descriptionText)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)
    setStoriesError(null)

    if (!baseUrl.trim() || !email.trim() || !apiKey.trim()) {
      setErrorMessage('Jira Base URL, Email ID and API Key are required')
      return
    }

    setIsLoading(true)

    try {
      const response = await testJiraConnection({
        baseUrl: baseUrl.trim(),
        email: email.trim(),
        apiKey: apiKey.trim(),
      })

      setSuccessMessage(
        response.message || 'Jira connection established successfully',
      )

      // After successful connection, fetch user stories
      setStories([])
      setSelectedIssueKey(null)
      setStoriesError(null)
      setStoriesLoading(true)

      try {
        const fetchedStories = await fetchJiraStories({
          baseUrl: baseUrl.trim(),
          email: email.trim(),
          apiKey: apiKey.trim(),
        })
        setStories(fetchedStories)
      } catch (storyError) {
        setStoriesError(
          storyError instanceof Error
            ? storyError.message
            : 'Failed to fetch Jira user stories',
        )
      } finally {
        setStoriesLoading(false)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to establish Jira connection',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="jira-panel">
      <h2 className="jira-panel-title">Jira Integration</h2>
      <p className="jira-panel-subtitle">
        Connect to Jira to sync user stories and generated test cases.
      </p>

      <form onSubmit={handleSubmit} className="jira-form">
        <div className="form-group">
          <label htmlFor="jiraBaseUrl" className="form-label">
            Jira Base URL *
          </label>
          <input
            id="jiraBaseUrl"
            type="text"
            className="form-input"
            placeholder="https://your-domain.atlassian.net"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="jiraEmail" className="form-label">
            Jira Email ID *
          </label>
          <input
            id="jiraEmail"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="jiraApiKey" className="form-label">
            Jira API Key *
          </label>
          <input
            id="jiraApiKey"
            type="password"
            className="form-input"
            placeholder="Enter your Jira API token"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="submit-btn jira-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect to Jira'}
        </button>
      </form>

      {successMessage && (
        <div className="jira-success-banner">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="jira-error-banner">
          {errorMessage}
        </div>
      )}

      {storiesLoading && (
        <div className="jira-stories-loading">
          Loading user stories from Jira...
        </div>
      )}

      {storiesError && !storiesLoading && (
        <div className="jira-error-banner">
          {storiesError}
        </div>
      )}

      {!storiesLoading && stories.length > 0 && (
        <div className="jira-stories-section">
          <h3 className="jira-stories-title">User stories from Jira (GEN)</h3>
          <p className="jira-stories-hint">
            Select a story to populate the Story Title and Acceptance Criteria on the left.
          </p>
          <div className="jira-stories-list">
            {stories.map((story) => (
              <label key={story.key} className="jira-story-item">
                <input
                  type="radio"
                  name="jira-story"
                  className="jira-story-radio"
                  value={story.key}
                  checked={selectedIssueKey === story.key}
                  onChange={() => handleStorySelect(story)}
                />
                <span className="jira-story-label">
                  <span className="jira-story-key">{story.key}</span>
                  <span className="jira-story-summary">{story.summary}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

