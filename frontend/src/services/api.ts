import axios, { AxiosInstance, AxiosError } from 'axios';
import { useSessionStore } from '../stores/sessionStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().sessionToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ success: boolean; error?: { code: string; message: string } }>) => {
    if (error.response?.status === 401) useSessionStore.getState().clearSession();
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> { success: boolean; data: T; message: string }
export interface Avatar { id: string; code: string; name: string; assetKey: string; sortOrder: number; inUse?: boolean }
export interface CreateSessionPayload { displayName: string; avatarId: string }
export interface CreateSessionResponse { sessionId: string; sessionToken: string; player: { id: string; displayName: string; avatar: { id: string; name: string; assetKey: string } } }
export interface QuickMatchResponse { matchId: string; status: 'waiting' | 'ready'; role: 'host' | 'guest'; player: { sessionId: string; displayName: string; avatar: { id: string; assetKey: string } } }
export interface MatchDetail { id: string; status: string; isHost: boolean; players: Array<{ sessionId: string; displayName: string; avatar: { id: string; assetKey: string }; color: string | null; isHost: boolean }> }
export interface MatchStateResponse { matchId: string; status: string; board: (string | null)[][]; currentTurnColor: string; turnRemainingSeconds: number; scores: { black: number; white: number }; validMoves: Array<{ row: number; col: number }>; players: Array<{ sessionId: string; displayName: string; color: string; avatar: { assetKey: string } }> }
export interface StartMatchResponse { matchId: string; status: string; boardSize: number; currentTurnColor: string; players: Array<{ sessionId: string; displayName: string; color: string; isHost: boolean }>; turnDeadlineAt: string }
export interface ResignResponse { matchId: string; status: string; winnerSessionId: string; winReason: string }

export async function fetchAvatars(): Promise<Avatar[]> {
  const r = await api.get<ApiResponse<Avatar[]>>('avatars');
  return r.data.data;
}
export async function createSession(payload: CreateSessionPayload): Promise<CreateSessionResponse> {
  const r = await api.post<ApiResponse<CreateSessionResponse>>('sessions', payload);
  return r.data.data;
}
export async function quickMatch(): Promise<QuickMatchResponse> {
  const r = await api.post<ApiResponse<QuickMatchResponse>>('matchmaking/quick-match');
  return r.data.data;
}
export async function getMatchDetail(matchId: string): Promise<MatchDetail> {
  const r = await api.get<ApiResponse<MatchDetail>>(`matches/${matchId}`);
  return r.data.data;
}
export async function startMatch(matchId: string, showHints: boolean = true): Promise<StartMatchResponse> {
  const r = await api.post<ApiResponse<StartMatchResponse>>(`matches/${matchId}/start`, { showHints });
  return r.data.data;
}
export async function getMatchState(matchId: string): Promise<MatchStateResponse> {
  const r = await api.get<ApiResponse<MatchStateResponse>>(`matches/${matchId}/state`);
  return r.data.data;
}
export async function resignMatch(matchId: string): Promise<ResignResponse> {
  const r = await api.post<ApiResponse<ResignResponse>>(`matches/${matchId}/resign`);
  return r.data.data;
}

const apiService = {
  getAvatars: () => wrap(fetchAvatars),
  createSession: (displayName: string, avatarId: string) => wrap(() => createSession({ displayName, avatarId })),
  quickMatch: () => wrap(quickMatch),
  getMatchDetail: (id: string) => wrap(() => getMatchDetail(id)),
  startMatch: (id: string, showHints: boolean = true) => wrap(() => startMatch(id, showHints)),
  getMatchState: (id: string) => wrap(() => getMatchState(id)),
  resignMatch: (id: string) => wrap(() => resignMatch(id)),
};

interface ApiResult<T> { success: boolean; data: T; error?: { code: string; message: string } }
async function wrap<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    return { success: true, data: await fn() };
  } catch (err: any) {
    const error = err?.response?.data?.error || { code: 'UNKNOWN', message: err?.message || 'Erro desconhecido' };
    return { success: false, data: null as unknown as T, error };
  }
}

export default apiService;
