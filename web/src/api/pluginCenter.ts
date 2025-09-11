export interface RepoItem {
  key: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  website?: string;
  github?: string;
  icon?: string;
  supportedExts?: string[];
  createdAt?: number;
  downloads?: number;
  directUrl: string;
}

export interface RepoListResponse {
  items: RepoItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RepoQueryParams {
  query?: string;
  author?: string;
  sort?: 'downloads' | 'createdAt';
  page?: number;
  pageSize?: number;
}

const CENTER_BASE = 'https://center.foxel.cc';

export function buildCenterUrl(path: string) {
  return new URL(path, CENTER_BASE).href;
}

export async function fetchRepoList(params: RepoQueryParams = {}): Promise<RepoListResponse> {
  const query = new URLSearchParams();
  if (params.query) query.set('query', params.query);
  if (params.author) query.set('author', params.author);
  if (params.sort) query.set('sort', params.sort);
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 12));

  const url = `${CENTER_BASE}/api/repo?${query.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Repo fetch failed: ${resp.status}`);
  }
  return await resp.json();
}

