export default async function handler(req, res) {
  // CORS headers - must be first, before anything can fail
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ticker = req.query.ticker;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker required' });
  }

  console.log(`[API] Request for: ${ticker}`);

  try {
    // Step 1: Get a cookie from Yahoo
    const cookieRes = await fetch('https://fc.yahoo.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const rawCookies = cookieRes.headers.get('set-cookie') || '';
    const cookieHeader = rawCookies
      .split(',')
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    console.log(`[API] Got cookies: ${cookieHeader ? 'yes' : 'no'}`);

    // Step 2: Get crumb using the cookie
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain',
        'Cookie': cookieHeader,
      }
    });

    const crumb = await crumbRes.text();
    console.log(`[API] Got crumb: ${crumb ? crumb.substring(0, 10) : 'none'}`);

    // Step 3: Fetch chart data with cookie + crumb
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10y&interval=1d&includePrePost=false${crumb ? `&crumb=${encodeURIComponent(crumb)}` : ''}`;

    console.log(`[API] Fetching chart: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      }
    });

    console.log(`[API] Chart response: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`[API] Error body: ${text.substring(0, 200)}`);
      return res.status(response.status).json({ error: `Yahoo returned ${response.status}` });
    }

    const data = await response.json();
    return res.json(data);

  } catch (e) {
    console.log(`[API] Exception: ${e.message}`);
    return res.status(500).json({ error: e.message });
  }
}
