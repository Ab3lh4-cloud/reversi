import { useMatchStore as useOriginalMatchStore } from './matchStore';

export function setIsMyTurn(isMyTurn: boolean) {
  useOriginalMatchStore.getState().setIsMyTurn(isMyTurn);
}

export function setOpponentConnected(connected: boolean) {
  const state = useOriginalMatchStore.getState();
  if (!connected) {
    state.setOpponentDisconnected(false);
  }
}
