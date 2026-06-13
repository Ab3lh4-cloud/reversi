import { CellState } from '../../stores/matchStore';
import DiscPiece from '../DiscPiece/DiscPiece';
import ValidMoveMarker from '../ValidMoveMarker/ValidMoveMarker';
import styles from './BoardCell.module.scss';

interface BoardCellProps {
  row: number;
  col: number;
  value: CellState;
  isValidMove: boolean;
  isLastMove: boolean;
  isFlipping: boolean;
  flipDirection?: 'black-to-white' | 'white-to-black';
  isNew: boolean;
  cellSize: number;
  onClick: () => void;
}

export default function BoardCell({
  row,
  col,
  value,
  isValidMove,
  isLastMove,
  isFlipping,
  flipDirection,
  isNew,
  cellSize,
  onClick,
}: BoardCellProps) {
  const discSize = Math.floor(cellSize * 0.85);

  return (
    <div
      className={`${styles.cell} ${isValidMove ? styles.validMove : ''} ${isLastMove ? styles.lastMove : ''}`}
      style={{ width: cellSize, height: cellSize }}
      onClick={onClick}
      role="button"
      aria-label={`Célula ${row + 1}, ${col + 1}`}
    >
      <div className={styles.cellInner}>
        {value && (
          <DiscPiece
            color={value}
            isFlipping={isFlipping}
            flipDirection={flipDirection}
            isNew={isNew}
            size={discSize}
          />
        )}
        {isValidMove && !value && (
          <ValidMoveMarker size={discSize} />
        )}
      </div>
    </div>
  );
}
