import { Client, Databases } from 'appwrite';

function createAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error('Appwrite configuration is missing.');
  }

  return new Client().setEndpoint(endpoint).setProject(projectId);
}

export function getDatabases() {
  return new Databases(createAppwriteClient());
}
