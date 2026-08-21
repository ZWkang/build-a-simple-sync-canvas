import { z } from 'zod';

const canvasSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
  title: z.string(),
  updatedAt: z.string().datetime(),
});

const canvasResponseSchema = z.object({ data: canvasSchema });
const canvasListResponseSchema = z.object({ data: z.array(canvasSchema) });
const apiErrorSchema = z.object({
  error: z.object({ code: z.string() }).passthrough(),
});

export type CanvasRecord = z.infer<typeof canvasSchema>;

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export class CanvasApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Canvas API request failed with ${status} ${code}`);
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (response.ok) {
    return response;
  }

  const errorPayload = apiErrorSchema.safeParse(await response.json());
  if (!errorPayload.success) {
    throw new Error(`Canvas API returned an invalid error response for ${path}`, {
      cause: errorPayload.error,
    });
  }

  throw new CanvasApiError(response.status, errorPayload.data.error.code);
}

function jsonRequest(method: 'PATCH' | 'POST', body: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function createCanvas(title: string): Promise<CanvasRecord> {
  const response = await request('/api/canvases', jsonRequest('POST', { title }));
  return canvasResponseSchema.parse(await response.json()).data;
}

export async function deleteCanvas(canvasId: string): Promise<void> {
  await request(`/api/canvases/${canvasId}`, { method: 'DELETE' });
}

export async function getCanvas(canvasId: string): Promise<CanvasRecord> {
  const response = await request(`/api/canvases/${canvasId}`);
  return canvasResponseSchema.parse(await response.json()).data;
}

export async function listCanvases(): Promise<CanvasRecord[]> {
  const response = await request('/api/canvases');
  return canvasListResponseSchema.parse(await response.json()).data;
}

export async function renameCanvas(canvasId: string, title: string): Promise<CanvasRecord> {
  const response = await request(`/api/canvases/${canvasId}`, jsonRequest('PATCH', { title }));
  return canvasResponseSchema.parse(await response.json()).data;
}

export function getCollaborationUrl(): string {
  const configuredUrl = import.meta.env.VITE_COLLABORATION_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return `${apiBaseUrl.replace(/^http/, 'ws')}/api/collaboration`;
}
