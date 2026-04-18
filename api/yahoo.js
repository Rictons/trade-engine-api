// api/yahoo.js - Vercel serverless function with request queuing
// This prevents overwhelming Yahoo Finance by spacing out requests

let requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const { ticker, resolve, reject } = requestQueue.shift();
    
    try {
      const clean = ticker.trim().toUpperCase();
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?range=10y&interval=1d&includePrePost=false`;
      
      const response = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        reject(new Error(`Yahoo returned ${response.status}`));
      } else {
        const data = await response.json();
        resolve(data);
      }
    } catch (error) {
      reject(error);
    }
    
    // Wait 500ms between requests to avoid overwhelming Yahoo
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  isProcessing = false;
}

function queueRequest(ticker) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ ticker, resolve, reject });
    processQueue();
  });
}

export default async function handler(req, res) {
  const { ticker } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }
  
  try {
    const data = await queueRequest(ticker);
    return res.status(200).json(data);
  } catch (error) {
    console.error(`[YAHOO-API] ${ticker}: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}
