export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const ticker = req.query.ticker;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=10y&interval=1d&includePrePost=false`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
