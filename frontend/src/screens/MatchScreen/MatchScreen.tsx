import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useMatchStore } from '@/stores/matchStore';
import { connectSocket, disconnectSocket, joinMatchRoom, playMove } from '@/services/socket';
import apiService from '@/services/apiService';
import ScreenContainer from '@/components/ScreenContainer/ScreenContainer';
import Board from '@/components/Board/Board';
import ScoreBoard from '@/components/ScoreBoard/ScoreBoard';
import TimerDisplay from '@/components/TimerDisplay/TimerDisplay';
import PlayerBadge from '@/components/PlayerBadge/PlayerBadge';
import ConnectionStatusBadge from '@/components/ConnectionStatusBadge/ConnectionStatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import ResultCard from '@/components/ResultCard/ResultCard';
import ToastMessage from '@/components/ToastMessage/ToastMessage';
import styles from './MatchScreen.module.scss';

export default function MatchScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const sessionStore = useSessionStore();
  const matchStore = useMatchStore();

  const [showResignDialog, setShowResignDialog] = useState(false);
  const [resigning, setResigning] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as const });

  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  }, []);

  const match = matchStore.match;
  const myColor = matchStore.myColor;
  const isMyTurn = matchStore.isMyTurn;
  const board = match?.board || [];
  const validMoves = match?.validMoves || [];
  const scores = match?.scores || { black: 0, white: 0 };
  const currentTurnColor = match?.currentTurnColor;
  const turnRemainingSeconds = match?.turnRemainingSeconds ?? 0;
  const players = match?.players || [];
  const lastMove = match?.lastMove;
  const flippingDiscs = matchStore.flippingDiscs;

  useEffect(() => {
    if (!matchId || !sessionStore.sessionToken) {
      navigate('/', { replace: true });
      return;
    }

    const socket = connectSocket();
    joinMatchRoom(matchId);

    const loadState = async () => {
      try {
        const result = await apiService.getMatchState(matchId);
        if (result.success) {
          const state = result.data;
          const myPlayer = state.players.find(
            (p) => p.sessionId === sessionStore.sessionId
          );
          if (myPlayer) {
            matchStore.setMyColor(myPlayer.color);
          }
          matchStore.setMatch({
            matchId: state.matchId,
            status: state.status as any,
            board: state.board as any,
            currentTurnColor: state.currentTurnColor,
            turnRemainingSeconds: state.turnRemainingSeconds,
            scores: state.scores,
            validMoves: state.validMoves,
            players: state.players.map((p) => ({
              sessionId: p.sessionId,
              displayName: p.displayName,
              color: p.color,
              avatar: p.avatar,
            })),
          });
          matchStore.setIsMyTurn(
            state.currentTurnColor === myPlayer?.color
          );
        }
      } catch {
        // Socket will sync state
      }
    };

    loadState();

    return () => {
      disconnectSocket();
    };
  }, [matchId, sessionStore.sessionToken, navigate, matchStore]);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || !matchId) return;
    const isValid = validMoves.some((m) => m.row === row && m.col === col);
    if (!isValid) return;
    playMove(matchId, row, col);
  };

  const handleResign = async () => {
    if (!matchId) return;
    try {
      setResigning(true);
      const result = await apiService.resignMatch(matchId);
      if (!result.success) {
        showToast(result.error?.message || 'Erro ao desistir');
      }
    } catch {
      showToast('Erro ao desistir');
    } finally {
      setResigning(false);
      setShowResignDialog(false);
    }
  };

  const handleExit = () => {
    matchStore.reset();
    sessionStore.clearMatch();
    disconnectSocket();
    navigate('/', { replace: true });
  };

  const localPlayer = sessionStore.player;
  const opponent = players.find((p) => p.sessionId !== sessionStore.sessionId);
  const localPlayerInMatch = players.find((p) => p.sessionId === sessionStore.sessionId);

  const myScore = myColor === 'black' ? scores.black : scores.white;
  const opponentScore = myColor === 'black' ? scores.white : scores.black;

  return (
    <ScreenContainer>
      <div className={styles.screen}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ConnectionStatusBadge
              connected={matchStore.connected}
              opponentDisconnected={matchStore.opponentDisconnected}
            />
          </div>
          <button
            className={styles.resignButton}
            onClick={() => setShowResignDialog(true)}
          >
            Desistir
          </button>
        </div>

        {/* Players info */}
        <div className={styles.playersRow}>
          {opponent && (
            <PlayerBadge
              displayName={opponent.displayName}
              assetKey={opponent.avatar?.assetKey}
              color={opponent.color}
              score={opponentScore}
              isActive={currentTurnColor === opponent.color}
              size="sm"
            />
          )}
        </div>

        {/* Timer */}
        <div className={styles.timerRow}>
          <TimerDisplay
            remainingSeconds={turnRemainingSeconds}
            isActive={isMyTurn}
            color={currentTurnColor || undefined}
          />
        </div>

        {/* Board */}
        <div className={styles.boardContainer}>
          <Board
            board={board}
            validMoves={validMoves}
            lastMove={lastMove}
            flippingDiscs={flippingDiscs}
            myColor={myColor}
            isMyTurn={isMyTurn}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Score */}
        <ScoreBoard
          blackScore={scores.black}
          whiteScore={scores.white}
          currentTurnColor={currentTurnColor}
        />

        {/* Local player */}
        {localPlayerInMatch && (
          <PlayerBadge
            displayName={localPlayerInMatch.displayName}
            assetKey={localPlayerInMatch.avatar?.assetKey}
            color={localPlayerInMatch.color}
            score={myScore}
            isActive={currentTurnColor === localPlayerInMatch.color}
            isLocal
            size="sm"
          />
        )}

        {/* Turn indicator */}
        <div className={styles.turnInfo}>
          {isMyTurn ? (
            <span className={styles.yourTurn}>Sua vez!</span>
          ) : (
            <span className={styles.opponentTurn}>
              Aguardando jogada do oponente...
            </span>
          )}
        </div>
      </div>

      {/* Resign dialog */}
      {showResignDialog && (
        <ConfirmDialog
          title="Desistir da partida"
          message="Tem certeza que deseja desistir? Isso encerrará a partida."
          confirmText="Desistir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleResign}
          onCancel={() => setShowResignDialog(false)}
          loading={resigning}
        />
      )}

      {/* Result card */}
      {matchStore.showResult && (
        <ResultCard onExit={handleExit} />
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
