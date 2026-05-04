// Use Appwrite REST API directly to avoid Node.js SDK dependency
// This eliminates the need for nodejs_compat flag on Cloudflare Pages

export async function getAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

  if (!endpoint || !projectId || !databaseId || !collectionId) {
    throw new Error('Appwrite configuration is missing.');
  }

  return { endpoint, projectId, databaseId, collectionId };
}

// Helper function to make authenticated Appwrite API requests
export async function appwriteFetch(
  path: string,
  options: RequestInit = {}
) {
  const config = await getAppwriteConfig();
  const url = `${config.endpoint}/v1${path}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': config.projectId,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Appwrite API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
