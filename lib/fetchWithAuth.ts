/**
 * Simple fetch wrapper (no auth needed)
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  console.log(`[fetchWithAuth] Request to: ${url}`);
  
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    console.log(`[fetchWithAuth] Response status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[fetchWithAuth] Network error:`, error);
    throw error;
  }
}

/**
 * GET request
 */
export async function getWithAuth(url: string) {
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * POST request
 */
export async function postWithAuth(url: string, data: any) {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * DELETE request
 */
export async function deleteWithAuth(url: string) {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
/**
 * PUT request with authentication
 */
export async function putWithAuth(url: string, data: any) {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}