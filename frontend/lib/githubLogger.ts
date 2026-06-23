export async function logTrainingDataToGitHub(
  filename: string,
  ocrText: string,
  aiResponse: any,
  urgencyLevel: string
) {
  try {
    const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('GITHUB_PAT not set, skipping training data logging');
      return false;
    }

    const repoOwner = 'Orangemangocat';
    const repoName = 'tenantguard-manus-retained';
    
    // Create timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
    
    // Clean filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const filePath = `AI_KNOWLEDGE/TRAINING_DATA/submissions/${timestamp}_${safeFilename}.md`;
    
    // Format the markdown content
    const content = `# Training Data Submission: ${safeFilename}
**Date:** ${now.toISOString()}
**Assigned Urgency Level:** ${urgencyLevel}

## AI Analysis Result
\`\`\`json
${JSON.stringify(aiResponse, null, 2)}
\`\`\`

## Original Document Text / OCR
\`\`\`text
${ocrText}
\`\`\`

---
*Note for trainers: To correct this response, edit the JSON block above and commit the changes. The training pipeline will pick up the corrected JSON.*
`;

    // Encode content to base64 for GitHub API
    const contentBase64 = Buffer.from(content).toString('base64');

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `data: log training submission for ${safeFilename}`,
        content: contentBase64,
        branch: 'main'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return false;
    }
    
    console.log(`Successfully logged training data to ${filePath}`);
    return true;
  } catch (error) {
    console.error('Failed to log training data to GitHub:', error);
    return false;
  }
}
