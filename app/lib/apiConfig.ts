'use client';

export type ApiValidationResult = {
  models: string[];
};

function removeTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function normalizeApiBaseUrl(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (!trimmed) return '';

  const withoutChatCompletions = trimmed.replace(/\/chat\/completions\/?$/i, '');
  const withoutModels = withoutChatCompletions.replace(/\/models\/?$/i, '');
  const normalized = removeTrailingSlash(withoutModels);

  if (/\/v\d+$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/v1`;
}

export function buildChatCompletionsUrl(endpoint: string): string {
  return `${normalizeApiBaseUrl(endpoint)}/chat/completions`;
}

export function buildModelsUrl(endpoint: string): string {
  return `${normalizeApiBaseUrl(endpoint)}/models`;
}

function extractErrorMessage(status: number, bodyText: string): string {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return `请求失败（${status}）`;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message || parsed.message || `请求失败（${status}）`;
  } catch {
    return trimmed.slice(0, 160);
  }
}

export async function fetchAvailableModels(endpoint: string, apiKey: string): Promise<string[]> {
  const response = await fetch(buildModelsUrl(endpoint), {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(extractErrorMessage(response.status, bodyText));
  }

  const data = await response.json();
  const models = Array.isArray(data?.data)
    ? data.data
        .map((model: { id?: string }) => model.id?.trim())
        .filter((modelId: string | undefined): modelId is string => Boolean(modelId))
    : [];

  return models;
}

export async function validateApiConfiguration(endpoint: string, apiKey: string): Promise<ApiValidationResult> {
  const models = await fetchAvailableModels(endpoint, apiKey);
  return { models };
}
