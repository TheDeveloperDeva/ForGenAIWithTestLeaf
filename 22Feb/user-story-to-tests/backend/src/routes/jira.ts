import express from 'express'
import axios from 'axios'

export const jiraRouter = express.Router()

interface JiraConnectionRequest {
  baseUrl: string
  email: string
  apiKey: string
}

interface JiraSearchRequest extends JiraConnectionRequest {
  jql?: string
  maxResults?: number
}

interface JiraAdfNode {
  type: string
  text?: string
  content?: JiraAdfNode[]
}

function extractTextFromAdfNode(node: JiraAdfNode | null | undefined): string {
  if (!node) return ''

  if (node.type === 'text' && node.text) {
    return node.text
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromAdfNode).join('')
  }

  return ''
}

function jiraDescriptionToText(description: any): string {
  if (!description || !Array.isArray(description.content)) return ''

  const paragraphs = (description.content as JiraAdfNode[])
    .map((paragraph) => extractTextFromAdfNode(paragraph).trim())
    .filter((text) => text.length > 0)

  return paragraphs.join('\n\n')
}

jiraRouter.post(
  '/test-connection',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { baseUrl, email, apiKey } = req.body as JiraConnectionRequest

      if (!baseUrl || !email || !apiKey) {
        res.status(400).json({
          success: false,
          error: 'baseUrl, email and apiKey are required',
        })
        return
      }

      const trimmedBaseUrl = baseUrl.replace(/\/+$/, '')
      const jiraUrl = `${trimmedBaseUrl}/rest/api/3/myself`

      try {
        const response = await axios.get(jiraUrl, {
          auth: {
            username: email,
            password: apiKey,
          },
        })

        const { displayName, emailAddress, accountId } = response.data

        res.json({
          success: true,
          message: `Connected to Jira as ${displayName}`,
          user: {
            displayName,
            emailAddress,
            accountId,
          },
        })
      } catch (error: any) {
        const status = error.response?.status ?? 500
        const statusText = error.response?.statusText ?? 'Unknown error'
        const data = error.response?.data
        const dataString =
          typeof data === 'string' ? data : JSON.stringify(data ?? {})

        const errorMessage = `Jira connection failed: ${status} ${statusText} - ${dataString}`

        res.status(status).json({
          success: false,
          error: errorMessage,
        })
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error testing Jira connection',
      })
    }
  },
)

jiraRouter.post(
  '/search-stories',
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const {
        baseUrl,
        email,
        apiKey,
        jql,
        maxResults,
      } = req.body as JiraSearchRequest

      if (!baseUrl || !email || !apiKey) {
        res.status(400).json({
          success: false,
          error: 'baseUrl, email and apiKey are required',
        })
        return
      }

      const trimmedBaseUrl = baseUrl.replace(/\/+$/, '')
      const searchUrl = `${trimmedBaseUrl}/rest/api/3/search/jql`

      const requestBody = {
        fields: ['summary', 'description', 'status', 'reporter'],
        jql: jql || 'Project = GEN',
        maxResults: typeof maxResults === 'number' ? maxResults : 273,
      }

      try {
        const response = await axios.post(searchUrl, requestBody, {
          auth: {
            username: email,
            password: apiKey,
          },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })

        const issues = Array.isArray(response.data?.issues)
          ? response.data.issues
          : []

        const normalizedIssues = issues.map((issue: any) => {
          const key = issue.key as string | undefined
          const summary = issue.fields?.summary as string | undefined
          const description = issue.fields?.description

          return {
            key: key || '',
            summary: summary || '',
            descriptionText: jiraDescriptionToText(description),
          }
        })

        res.json({
          success: true,
          issues: normalizedIssues,
        })
      } catch (error: any) {
        const status = error.response?.status ?? 500
        const statusText = error.response?.statusText ?? 'Unknown error'
        const data = error.response?.data
        const dataString =
          typeof data === 'string' ? data : JSON.stringify(data ?? {})

        const errorMessage = `Jira search failed: ${status} ${statusText} - ${dataString}`

        res.status(status).json({
          success: false,
          error: errorMessage,
        })
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error searching Jira stories',
      })
    }
  },
)


