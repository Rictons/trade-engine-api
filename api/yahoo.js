// api/yahoo.js - Vercel serverless function
// Deploy this to Vercel and update your HTML to call it
 
export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  const clean = ticker.trim().toUpperCase();
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=10y&interval=1d&includePrePost=false`;
  
  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo returned ${response.status}` });
    }
    
    const data = await response.json();
    
    // Return the raw Yahoo data - let the client parse it
    return res.status(200).json(data);
  } catch (error) {
    console.error(`[YAHOO-API] ${clean}: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}
 
