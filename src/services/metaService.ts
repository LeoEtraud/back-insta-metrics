/**
 * Serviço de integração com a Meta Graph API (Facebook/Instagram).
 * Responsável por troca de tokens OAuth, obtenção de páginas, mídia e insights.
 */

const META_GRAPH_VERSION = "v18.0";
const BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

function getConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const callbackUrl = process.env.META_CALLBACK_URL;
  if (!appId || !appSecret || !callbackUrl) {
    throw new Error("META_APP_ID, META_APP_SECRET e META_CALLBACK_URL devem estar configurados no .env");
  }
  return { appId, appSecret, callbackUrl };
}

export interface TokenResponse {
  accessToken: string;
  expiresIn?: number; // segundos
}

export interface PageWithInstagram {
  pageId: string;
  igUserId: string;
  username: string;
}

export interface MediaItem {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  caption?: string;
  timestamp: string;
}

export interface InsightValue {
  value: number;
}

export interface InsightData {
  name: string;
  period: string;
  values: { value: number }[];
}

/**
 * Troca o code OAuth por um access token de curta duração.
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const { appId, appSecret, callbackUrl } = getConfig();
  const url = `${BASE_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json()) as { error?: { message?: string }; access_token?: string; expires_in?: number };

  if (data.error) {
    throw new Error(data.error.message || "Falha ao trocar code por token");
  }

  return {
    accessToken: data.access_token!,
    expiresIn: data.expires_in,
  };
}

/**
 * Troca token de curta duração por token de longa duração (~60 dias).
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
  const { appId, appSecret } = getConfig();
  const url = `${BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json()) as { error?: { message?: string }; access_token?: string; expires_in?: number };

  if (data.error) {
    throw new Error(data.error.message || "Falha ao obter token de longa duração");
  }

  return {
    accessToken: data.access_token!,
    expiresIn: data.expires_in,
  };
}

/**
 * Busca páginas do Facebook do usuário com contas Instagram vinculadas.
 * Segue paginação (paging.next) para não perder páginas.
 */
export async function getPagesWithInstagram(accessToken: string): Promise<PageWithInstagram[]> {
  const results: PageWithInstagram[] = [];
  let nextUrl: string | null = `${BASE_URL}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(accessToken)}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const data = (await res.json()) as {
      error?: { code?: number; message?: string };
      data?: Array<{ id: string; name?: string; instagram_business_account?: { id: string; username: string } }>;
      paging?: { next?: string };
    };

    if (data.error) {
      if (data.error.code === 190) {
        throw new Error("Token expirado ou inválido. Reconecte o Instagram.");
      }
      throw new Error(data.error.message || "Falha ao buscar páginas");
    }

    const pages = data.data || [];
    for (const page of pages) {
      const ig = page.instagram_business_account;
      if (ig?.id && ig?.username) {
        results.push({
          pageId: page.id,
          igUserId: ig.id,
          username: ig.username,
        });
      }
    }

    nextUrl = data.paging?.next ?? null;
  }

  if (results.length === 0) {
    console.warn(
      "[META] getPagesWithInstagram: nenhuma página com Instagram encontrada. " +
        "Verifique se a conta que autorizou é admin da Página e se o Instagram está vinculado em Configurações da Página."
    );
  }

  return results;
}

/**
 * Busca mídia (posts) do Instagram do usuário.
 */
export async function getMedia(
  igUserId: string,
  accessToken: string,
  limit = 50
): Promise<MediaItem[]> {
  const fields = "id,media_type,media_url,permalink,caption,timestamp";
  const url = `${BASE_URL}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const data = (await res.json()) as { error?: { code?: number; message?: string }; data?: Array<{ id: string; media_type?: string; media_url?: string; permalink?: string; caption?: string; timestamp: string }> };

  if (data.error) {
    if (data.error.code === 190) {
      throw new Error("instagram_token_expired");
    }
    throw new Error(data.error.message || "Falha ao buscar mídia");
  }

  const items: MediaItem[] = (data.data || []).map((m) => ({
    id: m.id,
    media_type: m.media_type || "IMAGE",
    media_url: m.media_url,
    permalink: m.permalink,
    caption: m.caption,
    timestamp: m.timestamp,
  }));

  return items;
}

/**
 * Busca insights de um post específico.
 * Métricas: engagement (likes+comments+saves), reach, saved.
 */
export async function getMediaInsights(
  mediaId: string,
  accessToken: string,
  metrics: string[] = ["engagement", "reach", "saved"]
): Promise<Record<string, number>> {
  const metricStr = metrics.join(",");
  const url = `${BASE_URL}/${mediaId}/insights?metric=${metricStr}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const data = (await res.json()) as { error?: { code?: number }; data?: Array<{ name: string; values?: Array<{ value: number }> }> };

  if (data.error) {
    if (data.error.code === 100) return {};
    if (data.error.code === 190) throw new Error("instagram_token_expired");
    return {};
  }

  const result: Record<string, number> = {};
  for (const item of data.data || []) {
    const value = item.values?.[0]?.value ?? 0;
    result[item.name] = typeof value === "number" ? value : parseInt(String(value), 10) || 0;
  }

  return result;
}

/**
 * Busca insights da conta (métricas diárias).
 * period: day | week | days_28
 * metrics: impression_count, reach, follower_count, profile_views
 */
export async function getAccountInsights(
  igUserId: string,
  accessToken: string,
  period: "day" | "week" | "days_28" = "day",
  metrics: string[] = ["impression_count", "reach", "follower_count", "profile_views"],
  since?: number,
  until?: number
): Promise<{ date: string; [key: string]: any }[]> {
  const metricStr = metrics.join(",");
  let url = `${BASE_URL}/${igUserId}/insights?metric=${metricStr}&period=${period}&access_token=${encodeURIComponent(accessToken)}`;

  if (since) url += `&since=${since}`;
  if (until) url += `&until=${until}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    error?: { code?: number; message?: string };
    data?: Array<{ name: string; values?: Array<{ end_time?: string; value: number }> }>;
  };

  if (data.error) {
    if (data.error.code === 190) throw new Error("instagram_token_expired");
    throw new Error(data.error.message || "Falha ao buscar insights da conta");
  }

  // A API retorna um array de métricas, cada uma com values por dia.
  // Precisamos agregar por data.
  const byDate: Record<string, Record<string, number>> = {};

  for (const metric of data.data || []) {
    const metricName = metric.name;
    for (const v of metric.values || []) {
      const endTime = v.end_time;
      if (!endTime) continue;
      const dateStr = endTime.split("T")[0];
      if (!byDate[dateStr]) byDate[dateStr] = {};
      byDate[dateStr][metricName] = typeof v.value === "number" ? v.value : parseInt(String(v.value), 10) || 0;
    }
  }

  return Object.entries(byDate).map(([date, vals]) => ({
    date,
    ...vals,
  }));
}
