// api/yahoo.js - Multiple data sources fallback

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  const clean = ticker.trim().toUpperCase();
  
  // Try Yahoo Finance first
  console.log(`[YAHOO] ${clean}: Attempting...`);
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=10y&interval=1d&includePrePost=false`;
    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[YAHOO] ${clean}: SUCCESS`);
      return res.status(200).json(data);
    }
  } catch (error) {
    console.log(`[YAHOO] ${clean}: Failed - ${error.message}`);
  }
  
  // Try Polygon.io
  console.log(`[POLYGON] ${clean}: Attempting...`);
  try {
    const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(clean)}/range/1/day/2014-01-01/2025-12-31?sort=asc&apiKey=nxf4OUlW926qF5XV67Co_HzYPIGR93KH`;
    const response = await fetch(polygonUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length >= 20) {
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
    }
  } catch (error) {
    console.log(`[POLYGON] ${clean}: Failed - ${error.message}`);
  }
  
  // Try Alpha Vantage
  console.log(`[ALPHAVANTAGE] ${clean}: Attempting...`);
  try {
    const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(clean)}&outputsize=full&apikey=demo`;
    const response = await fetch(avUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    if (response.ok) {
      const data = await response.json();
      const ts = data['Time Series (Daily)'];
      if (ts && Object.keys(ts).length >= 20) {
        const dates = Object.keys(ts).sort();
        const transformed = {
          chart: {
            result: [{
              timestamp: dates.map(d => Math.floor(new Date(d).getTime() / 1000)),
              indicators: {
                quote: [{
                  open: dates.map(d => parseFloat(ts[d]['1. open'])),
                  high: dates.map(d => parseFloat(ts[d]['2. high'])),
                  low: dates.map(d => parseFloat(ts[d]['3. low'])),
                  close: dates.map(d => parseFloat(ts[d]['4. close'])),
                  volume: dates.map(d => parseInt(ts[d]['5. volume']) || 0)
                }]
              }
            }]
          }
        };
        console.log(`[ALPHAVANTAGE] ${clean}: SUCCESS`);
        return res.status(200).json(transformed);
      }
    }
  } catch (error) {
    console.log(`[ALPHAVANTAGE] ${clean}: Failed - ${error.message}`);
  }
  
  // Try Finnhub (for historical data via different endpoint)
  console.log(`[FINNHUB] ${clean}: Attempting...`);
  try {
    const finnhubUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(clean)}&resolution=D&from=1262304000&to=${Math.floor(Date.now() / 1000)}&token=sandbox`;
    const response = await fetch(finnhubUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.o && data.o.length >= 20) {
        const transformed = {
          chart: {
            result: [{
              timestamp: data.t,
              indicators: {
                quote: [{
                  open: data.o,
                  high: data.h,
                  low: data.l,
                  close: data.c,
                  volume: data.v || data.o.map(() => 0)
                }]
              }
            }]
          }
        };
        console.log(`[FINNHUB] ${clean}: SUCCESS`);
        return res.status(200).json(transformed);
      }
    }
  } catch (error) {
    console.log(`[FINNHUB] ${clean}: Failed - ${error.message}`);
  }
  
  return res.status(500).json({ error: 'All data sources failed' });
}
