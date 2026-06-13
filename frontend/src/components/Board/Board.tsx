import { useMemo } from 'react';
import { Board as BoardType, Position, FlippingDisc } from '../../stores/matchStore';
import BoardCell from '../BoardCell/BoardCell';
import styles from './Board.module.scss';

interface BoardProps {
  board: BoardType;
  validMoves: Position[];
  lastMove: Position | null | undefined;
  flippingDiscs: FlippingDisc[];
  myColor: 'black' | 'white' | null;
  isMyTurn: boolean;
  onCellClick: (row: number, col: number) => void;
  className?: string;
}

export default function Board({
  board,
  validMoves,
  lastMove,
  flippingDiscs,
  myColor,
  isMyTurn,
  onCellClick,
  className = '',
}: BoardProps) {
  const cellSize = useMemo(() => {
    // 8x8 grid, with some padding
    return Math.floor((Math.min(window.innerWidth - 32, 420)) / 8);
  }, []);

  const isValidMove = (row: number, col: number): boolean => {
    return validMoves.some((m) => m.row === row && m.col === col);
  };

  const isFlipping = (row: number, col: number): boolean => {
    return flippingDiscs.some((d) => d.row === row && d.col === col);
  };

  const getFlipDirection = (row: number, col: number): 'black-to-white' | 'white-to-black' | undefined => {
    const disc = flippingDiscs.find((d) => d.row === row && d.col === col);
    if (!disc) return undefined;
    return disc.fromColor === 'black' ? 'black-to-white' : 'white-to-black';
  };

  const isNewDisc = (row: number, col: number): boolean => {
    return flippingDiscs.some((d) => d.row === row && d.col === col);
  };

  const isLastMoveCell = (row: number, col: number): boolean => {
    return lastMove?.row === row && lastMove?.col === col;
  };

  return (
    <div className={`${styles.board} ${className}`}>
      <div className={styles.grid} style={{ maxWidth: cellSize * 8 }}>
        {/* Labels das colunas */}
        <div className={styles.colLabels}>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((label) => (
            <span key={label} className={styles.label} style={{ width: cellSize }}>
              {label}
            </span>
          ))}
        </div>

        {/* Tabuleiro */}
        <div className={styles.gridInner}>
          {/* Labels das linhas */}
          <div className={styles.rowLabels}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <span key={num} className={styles.label} style={{ height: cellSize }}>
                {num}
              </span>
            ))}
          </div>

          {/* Células */}
          <div className={styles.cells}>
            {board.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <BoardCell
                  key={`${rowIdx}-${colIdx}`}
                  row={rowIdx}
                  col={colIdx}
                  value={cell}
                  isValidMove={isValidMove(rowIdx, colIdx) && isMyTurn}
                  isLastMove={isLastMoveCell(rowIdx, colIdx)}
                  isFlipping={isFlipping(rowIdx, colIdx)}
                  flipDirection={getFlipDirection(rowIdx, colIdx)}
                  isNew={isNewDisc(rowIdx, colIdx)}
                  cellSize={cellSize}
                  onClick={() => onCellClick(rowIdx, colIdx)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
