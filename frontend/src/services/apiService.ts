import {
  fetchAvatars,
  createSession,
  quickMatch,
  getMatchDetail,
  startMatch,
  getMatchState,
  resignMatch,
  type Avatar,
  type CreateSessionPayload,
  type CreateSessionResponse,
  type QuickMatchResponse,
  type MatchDetail,
  type MatchStateResponse,
  type StartMatchResponse,
  type ResignResponse,
} from './api';

export interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function wrap<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err: any) {
    const error = err?.response?.data?.error || {
      code: 'UNKNOWN',
      message: err?.message || 'Erro desconhecido',
    };
    return { success: false, data: null as unknown as T, error };
  }
}

const apiService = {
  getAvatars: (): Promise<ApiResult<Avatar[]>> =>
    wrap(() => fetchAvatars()),

  createSession: (displayName: string, avatarId: string): Promise<ApiResult<CreateSessionResponse>> =>
    wrap(() => createSession({ displayName, avatarId })),

  quickMatch: (): Promise<ApiResult<QuickMatchResponse>> =>
    wrap(() => quickMatch()),

  getMatchDetail: (matchId: string): Promise<ApiResult<MatchDetail>> =>
    wrap(() => getMatchDetail(matchId)),

  startMatch: (matchId: string): Promise<ApiResult<StartMatchResponse>> =>
    wrap(() => startMatch(matchId)),

  getMatchState: (matchId: string): Promise<ApiResult<MatchStateResponse>> =>
    wrap(() => getMatchState(matchId)),

  resignMatch: (matchId: string): Promise<ApiResult<ResignResponse>> =>
    wrap(() => resignMatch(matchId)),
};

export default apiService;
