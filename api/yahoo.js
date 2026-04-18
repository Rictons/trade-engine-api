// api/yahoo.js - Fixed for special characters in tickers

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  const clean = ticker.trim().toUpperCase();
  
  // Try Yahoo first
  console.log(`[YAHOO] ${clean}: Fetching...`);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=10y&interval=1d&includePrePost=false`;
  
  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[YAHOO] ${clean}: SUCCESS`);
      return res.status(200).json(data);
    } else {
      console.log(`[YAHOO] ${clean}: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`[YAHOO] ${clean}: ${error.message}`);
  }
  
  // Try Polygon.io as fallback
  console.log(`[POLYGON] ${clean}: Trying fallback...`);
  const apiKey = 'nxf4OUlW926qF5XV67Co_HzYPIGR93KH';
  const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(clean)}/range/1/day/2014-01-01/2025-12-31?sort=asc&apiKey=${apiKey}`;
  
  try {
    const response = await fetch(polygonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (response.ok) {
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
      
      console.log(`[POLYGON] ${clean}: SUCCESS`);
      return res.status(200).json(transformed);
    }
  } catch (error) {
    console.error(`[POLYGON] ${clean}: ${error.message}`);
  }
  
  return res.status(500).json({ error: 'All sources failed' });
}
