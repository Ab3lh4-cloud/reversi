import { useMatchStore as useOriginalMatchStore } from './matchStore';

export function setIsMyTurn(isMyTurn: boolean) {
  useOriginalMatchStore.getState().setMyTurn(isMyTurn);
}

export function setOpponentConnected(connected: boolean) {
  const state = useOriginalMatchStore.getState();
  if (!connected) {
    state.setOpponentDisconnected(false);
  }
}
