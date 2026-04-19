export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const ticker = req.query.ticker;
  console.log(`[API] Received request for ticker: ${ticker}`);
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10y&interval=1d&includePrePost=false`;
    console.log(`[API] Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`[API] Yahoo response status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`[API] Error response: ${text.substring(0, 200)}`);
      return res.status(response.status).json({ error: `Yahoo returned ${response.status}` });
    }
    
    const data = await response.json();
    console.log(`[API] Success, returning data`);
    return res.json(data);
  } catch (e) {
    console.log(`[API] Exception: ${e.message}`);
    return res.status(500).json({ error: e.message });
  }
}
