/**
 * A generic SWR fetcher function that uses the native fetch API
 * and our Next.js API proxy route.
 * @param key The key for the SWR request, expected to be an array.
 */
export const fetcher = async (key: [string, string, object?]) => {
  const [endpoint, rpcUrl, payload] = key;

  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // For GET requests, payload will be undefined.
      // Our proxy will interpret this as a GET request to the RPC.
      method: payload ? 'POST' : 'GET',
      endpoint,
      rpcUrl,
      payload,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Create an error object with a message from the API response
    const error = new Error(errorData.error || 'An error occurred while fetching the data.');
    throw error;
  }

  return response.json();
};