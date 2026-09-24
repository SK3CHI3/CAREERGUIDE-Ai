// Example Netlify Function
// You can add serverless functions here if needed

export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'CareerPath AI API is working!',
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
  }
}
