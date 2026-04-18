// api/yahoo.js - Use Polygon.io instead of Yahoo (no rate limits on free tier)

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  const clean = ticker.trim().toUpperCase();
  
  // Polygon.io free API key (public, rate limited but generous)
  const apiKey = 'nxf4OUlW926qF5XV67Co_HzYPIGR93KH';
  
  try {
    // Get last 10 years of daily data
    const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(clean)}/range/1/day/2014-01-01/2025-12-31?sort=asc&apiKey=${apiKey}`;
    
    const response = await fetch(polygonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      console.error(`[POLYGON] ${clean}: HTTP ${response.status}`);
      return res.status(response.status).json({ error: `Polygon returned ${response.status}` });
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length < 20) {
      return res.status(400).json({ error: 'Insufficient data from Polygon' });
    }
    
    // Transform Polygon format to Yahoo-like format for compatibility
    const transformed = {
      chart: {
        result: [{
          timestamp: data.results.map(d => Math.floor(d.t / 1000)),
          indicators: {
            quote: [{
              open: data.results.map(d => d.o),
              high: data.results.map(d => d.h),
              low: data.results.map(d => d.l),
              close: data.results.map(d => d.c),
              volume: data.results.map(d => d.v)
            }]
          }
        }]
      }
    };
    
    return res.status(200).json(transformed);
  } catch (error) {
    console.error(`[POLYGON] ${clean}: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}
