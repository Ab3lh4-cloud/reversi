import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useMatchStore } from '@/stores/matchStore';
import { connectSocket, disconnectSocket, joinMatchRoom, playMove, resignMatch } from '@/services/socket';
import apiService from '@/services/apiService';
import ScreenContainer from '@/components/ScreenContainer/ScreenContainer';
import Board from '@/components/Board/Board';
import ScoreBoard from '@/components/ScoreBoard/ScoreBoard';
import TimerDisplay from '@/components/TimerDisplay/TimerDisplay';
import ResultCard from '@/components/ResultCard/ResultCard';
import ToastMessage from '@/components/ToastMessage/ToastMessage';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import styles from './MatchScreen.module.scss';

export default function MatchScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const sessionStore = useSessionStore();

  const match = useMatchStore((s) => s.match);
  const myColor = useMatchStore((s) => s.myColor);
  const isMyTurn = useMatchStore((s) => s.isMyTurn);
  const flippingDiscs = useMatchStore((s) => s.flippingDiscs);
  const showResult = useMatchStore((s) => s.showResult);
  const showHints = useMatchStore((s) => s.showHints);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'info' | 'success' });
  const [showExitDialog, setShowExitDialog] = useState(false);

  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  }, []);

  const board = match?.board || [];
  const validMoves = match?.validMoves || [];
  const scores = match?.scores || { black: 0, white: 0 };
  const currentTurnColor = match?.currentTurnColor ?? null;
  const turnRemainingSeconds = match?.turnRemainingSeconds ?? 0;
  const players = match?.players || [];
  const lastMove = match?.lastMove;

  const currentTurnPlayer = players.find((p) => p.color === currentTurnColor) ?? null;

  useEffect(() => {
    if (!matchId || !sessionStore.sessionToken) {
      navigate('/', { replace: true });
      return;
    }

    connectSocket();
    joinMatchRoom(matchId);

    const loadState = async () => {
      try {
        const result = await apiService.getMatchState(matchId);
        if (result.success) {
          const state = result.data;
          const store = useMatchStore.getState();
          const mySessionId = useSessionStore.getState().sessionId;
          const myPlayer = state.players.find((p: any) => p.sessionId === mySessionId);
          if (myPlayer) {
            store.setMyColor(myPlayer.color as 'black' | 'white' | null);
          }
          store.setMatch({
            matchId: state.matchId,
            status: state.status as any,
            board: state.board as any,
            currentTurnColor: state.currentTurnColor as 'black' | 'white' | null,
            turnRemainingSeconds: state.turnRemainingSeconds,
            scores: state.scores,
            validMoves: state.validMoves,
            players: state.players.map((p: any) => ({
              sessionId: p.sessionId,
              displayName: p.displayName,
              color: p.color as 'black' | 'white' | null,
              avatar: p.avatar,
            })),
          });
          store.setIsMyTurn(state.currentTurnColor === myPlayer?.color);
        }
      } catch {
        // Socket sincronizara via match.state
      }
    };

    loadState();

    return () => { disconnectSocket(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, sessionStore.sessionToken, navigate]);

  useEffect(() => {
    if (!showResult) return;
    const timer = setTimeout(() => {
      useMatchStore.getState().reset();
      useSessionStore.getState().clearMatch();
      disconnectSocket();
      navigate('/', { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [showResult, navigate]);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || !matchId) return;
    const isValid = validMoves.some((m) => m.row === row && m.col === col);
    if (!isValid) return;
    playMove(matchId, row, col);
  };

  const handleExit = () => {
    useMatchStore.getState().reset();
    useSessionStore.getState().clearMatch();
    disconnectSocket();
    navigate('/', { replace: true });
  };

  const handleResignConfirm = () => {
    if (matchId) resignMatch(matchId);
    useMatchStore.getState().reset();
    useSessionStore.getState().clearMatch();
    disconnectSocket();
    navigate('/', { replace: true });
  };

  return (
    <ScreenContainer>
      <div className={styles.screen}>

        {/* Placar */}
        <div className={styles.scoreSection}>
          <ScoreBoard
            blackScore={scores.black}
            whiteScore={scores.white}
            currentTurnColor={currentTurnColor}
          />
        </div>

        {/* Contagem regressiva */}
        <div className={styles.timerSection}>
          <TimerDisplay
            remainingSeconds={turnRemainingSeconds}
            isActive={isMyTurn}
            color={currentTurnColor || undefined}
          />
        </div>

        {/* Tabuleiro */}
        <div className={styles.boardSection}>
          <Board
            board={board}
            validMoves={validMoves}
            lastMove={lastMove}
            flippingDiscs={flippingDiscs}
            myColor={myColor}
            isMyTurn={isMyTurn}
            showHints={showHints}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Aviso de turno */}
        <div className={styles.turnSection}>
          {currentTurnPlayer && (
            <div className={`${styles.turnBadge} ${isMyTurn ? styles.myTurn : ''}`}>
              <div className={styles.turnAvatar}>
                {currentTurnPlayer.avatar?.assetKey ? (
                  <img
                    src={`/assets/${currentTurnPlayer.avatar.assetKey}`}
                    alt={currentTurnPlayer.displayName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${currentTurnPlayer.displayName}`;
                    }}
                  />
                ) : (
                  <span className={styles.avatarFallback}>
                    {currentTurnPlayer.displayName.charAt(0)}
                  </span>
                )}
              </div>
              <div className={styles.turnText}>
                <span className={styles.turnLabel}>
                  {isMyTurn ? 'Sua vez!' : 'Vez de'}
                </span>
                <span className={styles.turnName}>{currentTurnPlayer.displayName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botão sair */}
        <div className={styles.exitSection}>
          <button
            className={styles.exitButton}
            onClick={() => setShowExitDialog(true)}
          >
            Sair do Jogo
          </button>
        </div>

      </div>

      {showResult && (
        <ResultCard onExit={handleExit} />
      )}

      {showExitDialog && (
        <ConfirmDialog
          title="Sair do Jogo"
          message="Tem certeza que deseja desistir? O seu oponente será declarado vencedor."
          confirmText="Desistir"
          cancelText="Continuar Jogando"
          variant="danger"
          onConfirm={handleResignConfirm}
          onCancel={() => setShowExitDialog(false)}
        />
      )}

      <ToastMessage
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenContainer>
  );
}
