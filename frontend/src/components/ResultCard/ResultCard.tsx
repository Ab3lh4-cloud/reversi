import { useSessionStore } from '../../stores/sessionStore';
import { useMatchStore, WinReason } from '../../stores/matchStore';
import PrimaryButton from '../PrimaryButton/PrimaryButton';
import styles from './ResultCard.module.scss';

interface ResultCardProps {
  onExit: () => void;
}

function getWinReasonText(reason: WinReason): string {
  switch (reason) {
    case 'disc_count':
      return 'Vitória por contagem de peças!';
    case 'resignation':
      return 'Vitória por desistência!';
    case 'timeout':
      return 'Vitória por tempo esgotado!';
    case 'disconnection':
      return 'Vitória por desconexão!';
    default:
      return 'Fim de jogo!';
  }
}

export default function ResultCard({ onExit }: ResultCardProps) {
  const match = useMatchStore((s) => s.match);
  const mySessionId = useSessionStore((s) => s.sessionId);

  if (!match) return null;

  const isWinner = match.winnerSessionId === mySessionId;
  const winnerPlayer = match.players.find((p) => p.sessionId === match.winnerSessionId);
  const winReasonText = match.winReason ? getWinReasonText(match.winReason) : '';

  return (
    <div className={styles.overlay}>
      <div className={`${styles.card} ${isWinner ? styles.win : styles.lose}`}>
        {/* Efeito de brilho */}
        <div className={styles.glowEffect} />

        {/* Header */}
        <div className={styles.header}>
          {isWinner ? (
            <div className={styles.trophy}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M12 8H36V16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16V8Z" fill="currentColor" opacity="0.8"/>
                <path d="M8 12H14V16C14 18.5 12 20 8 20V12Z" fill="currentColor" opacity="0.5"/>
                <path d="M34 12H40V16C40 18.5 38 20 34 20V12Z" fill="currentColor" opacity="0.5"/>
                <rect x="20" y="28" width="8" height="6" rx="1" fill="currentColor" opacity="0.6"/>
                <rect x="16" y="34" width="16" height="4" rx="2" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
          ) : (
            <div className={styles.crown}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M8 34L16 14L24 24L32 14L40 34H8Z" fill="currentColor" opacity="0.6"/>
                <rect x="6" y="34" width="36" height="6" rx="2" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
          )}
        </div>

        {/* Título */}
        <h2 className={styles.title}>
          {isWinner ? 'VITÓRIA!' : 'DERROTA'}
        </h2>

        {/* Avatar e nome do vencedor */}
        {winnerPlayer && (
          <div className={styles.winnerInfo}>
            <div className={styles.winnerAvatar}>
              {winnerPlayer.avatar?.assetKey ? (
                <img
                  src={`/assets/${winnerPlayer.avatar.assetKey}`}
                  alt={winnerPlayer.displayName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${winnerPlayer.displayName}`;
                  }}
                />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {winnerPlayer.displayName.charAt(0)}
                </span>
              )}
            </div>
            <span className={styles.winnerName}>{winnerPlayer.displayName}</span>
          </div>
        )}

        {/* Placar final */}
        <div className={styles.scoreBoard}>
          <div className={styles.scoreItem}>
            <div className={styles.blackDisc} />
            <span className={styles.scoreValue}>{match.scores.black}</span>
          </div>
          <span className={styles.scoreDivider}>×</span>
          <div className={styles.scoreItem}>
            <div className={styles.whiteDisc} />
            <span className={styles.scoreValue}>{match.scores.white}</span>
          </div>
        </div>

        {/* Motivo */}
        <p className={styles.reason}>{winReasonText}</p>

        {/* Botão sair */}
        <PrimaryButton onClick={onExit} variant={isWinner ? 'success' : 'default'}>
          Voltar ao início
        </PrimaryButton>
      </div>
    </div>
  );
}
