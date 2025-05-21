module.exports = function extractASINInfo(url) {
  try {
    const parsedUrl = new URL(url);
    const domainMatch = parsedUrl.hostname.match(/amazon\.([a-z.]{2,})$/i);
    const asinMatch = parsedUrl.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

    if (!domainMatch || !asinMatch) {
      throw new Error('Invalid Amazon product URL');
    }

    return {
      asin: asinMatch[1],
      domain: domainMatch[1],
    };
  } catch (error) {
    throw new Error('Failed to extract ASIN info: ' + error.message);
  }
};
