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
  showHints?: boolean;
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
  showHints = true,
  className = '',
}: BoardProps) {
  const cellSize = useMemo(() => {
    // 32px = padding horizontal do .board (16px cada lado)
    // 8px extra de margem para nao encostar nas bordas da tela
    return Math.floor((Math.min(window.innerWidth - 40, 420)) / 8);
  }, []);

  const isValidMove = (row: number, col: number): boolean => {
    if (!showHints) return false;
    return validMoves.some((m) => m.row === row && m.col === col);
  };

  const isFlipping = (row: number, col: number): boolean =>
    flippingDiscs.some((d) => d.row === row && d.col === col);

  const getFlipDirection = (row: number, col: number): 'black-to-white' | 'white-to-black' | undefined => {
    const disc = flippingDiscs.find((d) => d.row === row && d.col === col);
    if (!disc) return undefined;
    return disc.fromColor === 'black' ? 'black-to-white' : 'white-to-black';
  };

  const isNewDisc = (row: number, col: number): boolean =>
    !!(lastMove && lastMove.row === row && lastMove.col === col);

  const isLastMoveCell = (row: number, col: number): boolean =>
    lastMove?.row === row && lastMove?.col === col;

  return (
    <div className={`${styles.board} ${className}`}>
      <div
        className={styles.cells}
        style={{ width: cellSize * 8, height: cellSize * 8 }}
      >
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
  );
}
