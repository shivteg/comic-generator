export function getCloudflareCredentials() {
  const accountIdsStr = process.env.CLOUDFLARE_ACCOUNT_IDS || process.env.CLOUDFLARE_ACCOUNT_ID;
  const tokensStr = process.env.CLOUDFLARE_API_TOKENS || process.env.CLOUDFLARE_API_TOKEN;

  if (!accountIdsStr || !tokensStr) {
    throw new Error('Cloudflare credentials are not configured in environment variables.');
  }

  const accounts = accountIdsStr.split(',').map(s => s.trim()).filter(Boolean);
  const tokens = tokensStr.split(',').map(s => s.trim()).filter(Boolean);

  if (tokens.length === 0 || accounts.length === 0) {
    throw new Error('No valid Cloudflare credentials found.');
  }

  // Randomly select a token to avoid rate limits
  const index = Math.floor(Math.random() * tokens.length);
  const token = tokens[index];
  
  // If multiple account IDs are provided, try to match the index, otherwise fallback to the first one
  const accountId = accounts[index] || accounts[0];

  return { accountId, apiToken: token };
}
