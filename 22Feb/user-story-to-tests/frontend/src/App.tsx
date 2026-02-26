import { useState } from 'react'
import { generateTests } from './api'
import { GenerateRequest, GenerateResponse, TestCase } from './types'
import { DownloadButtons } from './components/DownloadButtons'
import { JiraPanel } from './components/JiraPanel'

function App() {
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: ''
  })
  const [results, setResults] = useState<GenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null)
  const [editedCases, setEditedCases] = useState<Map<string, TestCase>>(new Map())

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId)
    } else {
      newExpanded.add(testCaseId)
    }
    setExpandedTestCases(newExpanded)
  }

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.storyTitle.trim() || !formData.acceptanceCriteria.trim()) {
      setError('Story Title and Acceptance Criteria are required')
      return
    }

    setIsLoading(true)
    setError(null)
    setEditedCases(new Map())
    setEditingTestCaseId(null)
    
    try {
      const response = await generateTests(formData)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCaseId(testCase.id)
    if (!editedCases.has(testCase.id)) {
      setEditedCases(new Map(editedCases).set(testCase.id, { ...testCase }))
    }
  }

  const handleSaveTestCase = (testCaseId: string) => {
    if (!results) return
    
    const editedCase = editedCases.get(testCaseId)
    if (!editedCase) return

    const updatedCases = results.cases.map(tc => 
      tc.id === testCaseId ? editedCase : tc
    )
    
    setResults({
      ...results,
      cases: updatedCases
    })
    setEditingTestCaseId(null)
  }

  const handleCancelEdit = () => {
    setEditingTestCaseId(null)
  }

  const handleEditFieldChange = (testCaseId: string, field: keyof TestCase, value: any) => {
    const currentCase = editedCases.get(testCaseId)
    if (!currentCase) return

    if (field === 'steps') {
      setEditedCases(new Map(editedCases).set(testCaseId, {
        ...currentCase,
        steps: value
      }))
    } else {
      setEditedCases(new Map(editedCases).set(testCaseId, {
        ...currentCase,
        [field]: value
      }))
    }
  }

  const handleEditStepChange = (testCaseId: string, stepIndex: number, newValue: string) => {
    const currentCase = editedCases.get(testCaseId)
    if (!currentCase) return

    const updatedSteps = [...currentCase.steps]
    updatedSteps[stepIndex] = newValue
    
    setEditedCases(new Map(editedCases).set(testCaseId, {
      ...currentCase,
      steps: updatedSteps
    }))
  }

  const handleAddStep = (testCaseId: string) => {
    const currentCase = editedCases.get(testCaseId)
    if (!currentCase) return

    const updatedSteps = [...currentCase.steps, '']
    setEditedCases(new Map(editedCases).set(testCaseId, {
      ...currentCase,
      steps: updatedSteps
    }))
  }

  const handleRemoveStep = (testCaseId: string, stepIndex: number) => {
    const currentCase = editedCases.get(testCaseId)
    if (!currentCase) return

    const updatedSteps = currentCase.steps.filter((_, i) => i !== stepIndex)
    setEditedCases(new Map(editedCases).set(testCaseId, {
      ...currentCase,
      steps: updatedSteps
    }))
  }

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 95%;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 90%;
            padding: 30px;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            max-width: 85%;
            padding: 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .container {
            max-width: 1800px;
            padding: 50px;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .error-banner {
          background: #e74c3c;
          color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e8ed;
        }
        
        .results-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-meta {
          color: #666;
          font-size: 14px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }
        
        .results-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .results-table tr:hover {
          background: #f8f9fa;
        }
        
        .category-positive { color: #27ae60; font-weight: 600; }
        .category-negative { color: #e74c3c; font-weight: 600; }
        .category-edge { color: #f39c12; font-weight: 600; }
        .category-authorization { color: #9b59b6; font-weight: 600; }
        .category-non-functional { color: #34495e; font-weight: 600; }
        
        .test-case-id {
          cursor: pointer;
          color: #3498db;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .test-case-id:hover {
          background: #f8f9fa;
        }
        
        .test-case-id.expanded {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(90deg);
        }
        
        .expanded-details {
          margin-top: 15px;
          background: #fafbfc;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
        }
        
        .step-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .step-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .step-id {
          font-weight: 600;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .step-description {
          color: #2c3e50;
          line-height: 1.5;
        }
        
        .step-test-data {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        .step-expected {
          color: #27ae60;
          font-weight: 500;
          font-size: 14px;
        }
        
        .step-labels {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 2.5fr) minmax(320px, 1fr);
          gap: 24px;
          align-items: flex-start;
        }

        .main-content {
          min-width: 0;
        }

        .jira-panel {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-left: 4px solid #0052cc;
        }

        .jira-panel-title {
          font-size: 1.4rem;
          color: #253858;
          margin-bottom: 8px;
        }

        .jira-panel-subtitle {
          font-size: 0.9rem;
          color: #6b778c;
          margin-bottom: 20px;
        }

        .jira-submit-btn {
          width: 100%;
          margin-top: 8px;
          background: #0052cc;
        }

        .jira-submit-btn:hover:not(:disabled) {
          background: #0747a6;
        }

        .jira-success-banner {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 6px;
          background: #e3fcef;
          color: #006644;
          font-size: 0.9rem;
          border: 1px solid #00664433;
        }

        .jira-error-banner {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 6px;
          background: #ffebe6;
          color: #de350b;
          font-size: 0.9rem;
          border: 1px solid #de350b33;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .jira-stories-loading {
          margin-top: 16px;
          font-size: 0.9rem;
          color: #6b778c;
        }

        .jira-stories-section {
          margin-top: 20px;
          border-top: 1px solid #ebecf0;
          padding-top: 16px;
        }

        .jira-stories-title {
          font-size: 1rem;
          color: #253858;
          margin-bottom: 4px;
        }

        .jira-stories-hint {
          font-size: 0.8rem;
          color: #6b778c;
          margin-bottom: 12px;
        }

        .jira-stories-list {
          max-height: 260px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .jira-story-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 4px;
          border-radius: 4px;
          cursor: pointer;
        }

        .jira-story-item:hover {
          background: #f4f5f7;
        }

        .jira-story-radio {
          margin-top: 3px;
        }

        .jira-story-label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .jira-story-key {
          font-size: 0.8rem;
          font-weight: 600;
          color: #0052cc;
        }

        .jira-story-summary {
          font-size: 0.9rem;
          color: #172b4d;
        }

        .edit-mode-row {
          background: #fffbf0;
        }

        .edit-form-group {
          margin-bottom: 16px;
        }

        .edit-form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #2c3e50;
          font-size: 14px;
        }

        .edit-form-input, .edit-form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .edit-form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .edit-form-input:focus, .edit-form-textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .edit-button-group {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .edit-btn-save {
          background: #27ae60;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .edit-btn-save:hover {
          background: #229954;
        }

        .edit-btn-cancel {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .edit-btn-cancel:hover {
          background: #c0392b;
        }

        .edit-btn-edit {
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background-color 0.2s;
        }

        .edit-btn-edit:hover {
          background: #2980b9;
        }

        .table-action-cell {
          text-align: center;
        }

        .edit-steps-container {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }

        .edit-steps-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 16px;
        }

        .edit-step-item {
          display: grid;
          grid-template-columns: 50px 1fr 50px;
          gap: 10px;
          margin-bottom: 15px;
          align-items: start;
        }

        .edit-step-number {
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          text-align: center;
          font-weight: 600;
          color: #2c3e50;
          font-size: 12px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-step-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .edit-step-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 40px;
        }

        .edit-step-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .edit-step-remove-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          min-height: 40px;
          transition: background-color 0.2s;
        }

        .edit-step-remove-btn:hover {
          background: #c0392b;
        }

        .edit-add-step-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          margin-top: 15px;
          transition: background-color 0.2s;
        }

        .edit-add-step-btn:hover {
          background: #229954;
        }

        @media (max-width: 1023px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .jira-panel {
            margin-top: 24px;
          }
        }
      `}</style>
      
      <div className="container">
        <div className="header">
          <h1 className="title">User Story to Tests</h1>
          <p className="subtitle">Generate comprehensive test cases from your user stories</p>
        </div>

        <div className="layout">
          <div className="main-content">
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label htmlFor="storyTitle" className="form-label">
                  Story Title *
                </label>
                <input
                  type="text"
                  id="storyTitle"
                  className="form-input"
                  value={formData.storyTitle}
                  onChange={(e) => handleInputChange('storyTitle', e.target.value)}
                  placeholder="Enter the user story title..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional description (optional)..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="acceptanceCriteria" className="form-label">
                  Acceptance Criteria *
                </label>
                <textarea
                  id="acceptanceCriteria"
                  className="form-textarea"
                  value={formData.acceptanceCriteria}
                  onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
                  placeholder="Enter the acceptance criteria..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="additionalInfo" className="form-label">
                  Additional Info
                </label>
                <textarea
                  id="additionalInfo"
                  className="form-textarea"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  placeholder="Any additional information (optional)..."
                />
              </div>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </form>

            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="loading">
                Generating test cases...
              </div>
            )}

            {results && (
              <div className="results-container">
                <div className="results-header">
                  <h2 className="results-title">Generated Test Cases</h2>
                  <div className="results-meta">
                    {results.cases.length} test case(s) generated
                    {results.model && ` • Model: ${results.model}`}
                    {results.promptTokens > 0 && ` • Tokens: ${results.promptTokens + results.completionTokens}`}
                  </div>
                </div>
                
                <div className="table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Test Case ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Expected Result</th>
                        <th className="table-action-cell">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.cases.map((testCase: TestCase) => {
                        const isEditing = editingTestCaseId === testCase.id
                        const editedCase = editedCases.get(testCase.id) || testCase
                        
                        return (
                          <>
                            <tr key={testCase.id} className={isEditing ? 'edit-mode-row' : ''}>
                              <td>
                                <div 
                                  className={`test-case-id ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}
                                  onClick={() => !isEditing && toggleTestCaseExpansion(testCase.id)}
                                  style={{ cursor: isEditing ? 'default' : 'pointer' }}
                                >
                                  <span className={`expand-icon ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}>
                                    ▶
                                  </span>
                                  {testCase.id}
                                </div>
                              </td>
                              <td>{isEditing ? (
                                <input
                                  type="text"
                                  className="edit-form-input"
                                  value={editedCase.title}
                                  onChange={(e) => handleEditFieldChange(testCase.id, 'title', e.target.value)}
                                />
                              ) : (
                                testCase.title
                              )}</td>
                              <td>{isEditing ? (
                                <input
                                  type="text"
                                  className="edit-form-input"
                                  value={editedCase.category}
                                  onChange={(e) => handleEditFieldChange(testCase.id, 'category', e.target.value)}
                                />
                              ) : (
                                <span className={`category-${testCase.category.toLowerCase()}`}>
                                  {testCase.category}
                                </span>
                              )}</td>
                              <td>{isEditing ? (
                                <textarea
                                  className="edit-form-textarea"
                                  value={editedCase.expectedResult}
                                  onChange={(e) => handleEditFieldChange(testCase.id, 'expectedResult', e.target.value)}
                                  style={{ minHeight: '60px' }}
                                />
                              ) : (
                                testCase.expectedResult
                              )}</td>
                              <td className="table-action-cell">
                                {isEditing ? (
                                  <div className="edit-button-group">
                                    <button 
                                      className="edit-btn-save"
                                      onClick={() => handleSaveTestCase(testCase.id)}
                                    >
                                      Save
                                    </button>
                                    <button 
                                      className="edit-btn-cancel"
                                      onClick={handleCancelEdit}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="edit-btn-edit"
                                    onClick={() => handleEditTestCase(testCase)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedTestCases.has(testCase.id) && (
                              <tr key={`${testCase.id}-details`}>
                                <td colSpan={5}>
                                  <div className="expanded-details">
                                    <h4 style={{marginBottom: '15px', color: '#2c3e50'}}>Test Steps for {testCase.id}</h4>
                                    
                                    {isEditing ? (
                                      <div className="edit-steps-container">
                                        <div className="edit-steps-title">Edit Test Steps</div>
                                        {editedCase.steps.map((step, stepIndex) => (
                                          <div key={stepIndex} className="edit-step-item">
                                            <div className="edit-step-number">S{String(stepIndex + 1).padStart(2, '0')}</div>
                                            <div className="edit-step-input-wrapper">
                                              <textarea
                                                className="edit-step-input"
                                                value={step}
                                                onChange={(e) => handleEditStepChange(testCase.id, stepIndex, e.target.value)}
                                                placeholder={`Enter step ${stepIndex + 1} description...`}
                                              />
                                            </div>
                                            <button
                                              className="edit-step-remove-btn"
                                              onClick={() => handleRemoveStep(testCase.id, stepIndex)}
                                              title="Remove this step"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          className="edit-add-step-btn"
                                          onClick={() => handleAddStep(testCase.id)}
                                        >
                                          + Add Step
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="step-labels">
                                          <div>Step ID</div>
                                          <div>Step Description</div>
                                          <div>Test Data</div>
                                          <div>Expected Result</div>
                                        </div>
                                        {testCase.steps.map((step, index) => (
                                          <div key={index} className="step-item">
                                            <div className="step-header">
                                              <div className="step-id">S{String(index + 1).padStart(2, '0')}</div>
                                              <div className="step-description">{step}</div>
                                              <div className="step-test-data">{testCase.testData || 'N/A'}</div>
                                              <div className="step-expected">
                                                {index === testCase.steps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                <DownloadButtons results={results} storyTitle={formData.storyTitle} />
              </div>
            )}
          </div>

          <JiraPanel
            onStorySelected={(summary, descriptionText) =>
              setFormData(prev => ({
                ...prev,
                storyTitle: summary,
                acceptanceCriteria: descriptionText
              }))
            }
          />
        </div>
      </div>
    </div>
  )
}

export default App