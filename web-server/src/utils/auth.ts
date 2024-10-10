import axios from 'axios';
import { isNil, reject } from 'ramda';

import { Integration } from '@/constants/integrations';
import user from '@/api/resources/search/user';

export const unlinkProvider = async (orgId: string, provider: Integration) => {
  return await axios.delete(`/api/resources/orgs/${orgId}/integration`, {
    params: { provider }
  });
};

export const linkProvider = async (
stuff: string, orgId: string, provider: Integration, meta?: Record<string, any>) => {
  return await axios.post(
    `/api/resources/orgs/${orgId}/integration`,
    reject(isNil, {
      provider,
      the_good_stuff: stuff,
      meta_data: meta
    })
  );
};

// GitHub functions

export async function checkGitHubValidity(
  good_stuff: string
): Promise<boolean> {
  try {
    await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${good_stuff}`
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

const PAT_SCOPES = ['read:org', 'read:user', 'repo', 'workflow'];
export const getMissingPATScopes = async (pat: string) => {
  try {
    const response = await axios.get('https://api.github.com', {
      headers: {
        Authorization: `token ${pat}`
      }
    });

    const scopesString = response.headers['x-oauth-scopes'];
    if (!scopesString) return PAT_SCOPES;

    const userScopes = scopesString.split(',').map((scope) => scope.trim());
    return PAT_SCOPES.filter((scope) => !userScopes.includes(scope));
  } catch (error) {
    throw new Error('Failed to get missing PAT scopes', error);
  }
};

// GitLab functions

export const checkGitLabValidity = async (
  accessToken: string,
  customDomain?: string
) => {
  const baseUrl = customDomain || 'https://gitlab.com';
  const url = `${baseUrl}/api/v4/personal_access_tokens/self`;
  try {
    const response = await axios.get(url, {
      headers: {
        'PRIVATE-TOKEN': accessToken
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Invalid access token', error);
  }
};

const GITLAB_SCOPES = ['api', 'read_api', 'read_user'];

export const getMissingGitLabScopes = (scopes: string[]): string[] => {
  const missingScopes = GITLAB_SCOPES.filter(
    (scope) => !scopes.includes(scope)
  );
  return missingScopes;
};

// Bitbucket functions

// Function to check if the Bitbucket credentials are valid using App Passwords
export const checkBitbucketValidity = async (username: string, appPassword: string) => {
  const url = 'https://api.bitbucket.org/2.0/user/';  // Endpoint to fetch user info
  const authHeader = Buffer.from(`${username}:${appPassword}`).toString('base64'); // Basic Auth header

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${authHeader}`, // Send Basic Auth header
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Invalid Bitbucket App Password or username');
  }
};


export const getMissingBitbucketPermissions = async (username: string, appPassword: string) => {
  const authHeader = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const endpoints = {
    user: 'https://api.bitbucket.org/2.0/user/',
    repositories: 'https://api.bitbucket.org/2.0/repositories/',
  };

  const missingPermissions: string[] = [];

  for (const [permission, endpoint] of Object.entries(endpoints)) {
    console.log('Bitbucket endpoint (Start of loop):', endpoint);
    console.log('Bitbucket permission (Start of loop):', permission);
    try {
      await axios.get(endpoint, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
    });

    } 
    catch (error) {
      missingPermissions.push(permission);  // If the request fails, permission might be missing
    }
  }

  return missingPermissions;
};