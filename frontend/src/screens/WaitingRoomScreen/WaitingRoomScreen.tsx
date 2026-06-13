import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useMatchStore } from '@/stores/matchStore';
import { connectSocket, disconnectSocket, joinMatchRoom } from '@/services/socket';
import apiService from '@/services/apiService';
import ScreenContainer from '@/components/ScreenContainer/ScreenContainer';
import PlayerBadge from '@/components/PlayerBadge/PlayerBadge';
import PrimaryButton from '@/components/PrimaryButton/PrimaryButton';
import ConnectionStatusBadge from '@/components/ConnectionStatusBadge/ConnectionStatusBadge';
import ToastMessage from '@/components/ToastMessage/ToastMessage';
import styles from './WaitingRoomScreen.module.scss';

export default function WaitingRoomScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const sessionStore = useSessionStore();
  const matchStore = useMatchStore();

  const [starting, setStarting] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'info' | 'success' });

  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  }, []);

  const isHost = sessionStore.matchRole === 'host';
  const match = matchStore.match;
  const players = match?.players || [];
  const hasTwoPlayers = players.length >= 2;
  const isReady = match?.status === 'ready' || hasTwoPlayers;

  // Carregar estado inicial da partida via REST
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    async function loadMatchDetail() {
      const result = await apiService.getMatchDetail(matchId!);
      if (cancelled || !result.success) return;
      const d = result.data;
      matchStore.setMatch({
        matchId: d.id,
        status: d.status as any,
        board: [],
        currentTurnColor: null,
        turnRemainingSeconds: 0,
        scores: { black: 0, white: 0 },
        validMoves: [],
        players: d.players.map((p) => ({
          sessionId: p.sessionId,
          displayName: p.displayName,
          color: p.color as 'black' | 'white' | null,
          avatar: { assetKey: p.avatar.assetKey },
          isHost: p.isHost,
        })),
      });
    }

    loadMatchDetail();
    return () => { cancelled = true; };
  }, [matchId]);

  // Conectar socket e entrar na sala
  useEffect(() => {
    if (!matchId || !sessionStore.sessionToken) {
      navigate('/', { replace: true });
      return;
    }

    connectSocket();
    joinMatchRoom(matchId);

    return () => {
      disconnectSocket();
    };
  }, [matchId, sessionStore.sessionToken, navigate]);

  // Navegar quando partida iniciar
  useEffect(() => {
    if (match?.status === 'in_progress') {
      navigate(`/match/${matchId}`, { replace: true });
    }
  }, [match?.status, matchId, navigate]);

  const handleStart = async () => {
    if (!matchId) return;
    try {
      setStarting(true);
      const result = await apiService.startMatch(matchId, showHints);
      if (!result.success) {
        showToast(result.error?.message || 'Erro ao iniciar partida');
      }
    } catch {
      showToast('Erro ao iniciar partida');
    } finally {
      setStarting(false);
    }
  };

  const handleExit = () => {
    disconnectSocket();
    sessionStore.clearSession();
    navigate('/', { replace: true });
  };

  const localPlayer = sessionStore.player;
  const opponent = players.find((p) => p.sessionId !== sessionStore.sessionId);

  return (
    <ScreenContainer>
      <div className={styles.screen}>
        <div className={styles.header}>
          <h1 className={styles.title}>SALA DE ESPERA</h1>
          <ConnectionStatusBadge
            connected={matchStore.connected}
            opponentDisconnected={matchStore.opponentDisconnected}
          />
        </div>

        <div className={styles.matchCard}>
          <div className={styles.matchId}>
            <span className={styles.matchLabel}>Partida</span>
            <span className={styles.matchValue}>{matchId?.slice(0, 8)}...</span>
          </div>

          <div className={styles.playersSection}>
            {localPlayer && (
              <PlayerBadge
                displayName={localPlayer.displayName}
                assetKey={localPlayer.avatar?.assetKey}
                isLocal
                size="lg"
              />
            )}

            <div className={styles.vsDivider}>
              <span className={styles.vsText}>VS</span>
              <div className={styles.vsLine} />
            </div>

            {opponent ? (
              <PlayerBadge
                displayName={opponent.displayName}
                assetKey={opponent.avatar?.assetKey}
                size="lg"
              />
            ) : (
              <div className={styles.waitingOpponent}>
                <div className={styles.waitingAvatar}>
                  <span className={styles.waitingIcon}>?</span>
                </div>
                <span className={styles.waitingText}>Aguardando oponente...</span>
              </div>
            )}
          </div>

          <div className={styles.statusSection}>
            <div className={`${styles.statusBadge} ${hasTwoPlayers ? styles.ready : styles.waiting}`}>
              <span className={styles.statusDot} />
              <span>
                {hasTwoPlayers ? 'Sala pronta!' : 'Aguardando jogador...'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            {isHost && (
              <>
                <div className={styles.hintsToggle}>
                  <span className={styles.hintsLabel}>Sugestões de jogada</span>
                  <button
                    className={`${styles.toggle} ${showHints ? styles.toggleOn : ''}`}
                    onClick={() => setShowHints((v) => !v)}
                    role="switch"
                    aria-checked={showHints}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                <PrimaryButton
                  onClick={handleStart}
                  disabled={!hasTwoPlayers}
                  loading={starting}
                >
                  Começar Jogo
                </PrimaryButton>
              </>
            )}
            {!isHost && (
              <div className={styles.waitingMessage}>
                <span className={styles.waitingDots}>Aguardando o host iniciar...</span>
              </div>
            )}
            <button className={styles.exitButton} onClick={handleExit}>
              Sair da sala
            </button>
          </div>
        </div>

        <ToastMessage
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </div>
    </ScreenContainer>
  );
}
