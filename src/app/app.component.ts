import { Component, OnInit, signal } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

import { CounterComponent } from './counter/counter.component';
import { Square } from './square';

enum GameLevelEnum {
  EASY,
  MEDIUM,
  HARD,
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CounterComponent, NgStyle, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'minesweeper';
  squares: Square[] = [];
  level = signal<GameLevelEnum>(GameLevelEnum.EASY);
  bombsIndexes: Set<string> = new Set();
  hasExploded = signal(false);
  hasWon = signal(false);
  loading = signal(false);
  isLoading = signal(false);
  boardDimension = 9;
  bombsQuantity = 10;

  ngOnInit(): void {
    this.reset();
  }

  reset(): void {
    this.isLoading.set(true);

    this.hasExploded.set(false);
    this.bombsIndexes = new Set();
    this.setSquares();

    this.isLoading.set(false);
  }

  select(square: Square): void {
    if (square.isFlag || this.hasExploded()) return;

    square.isVisible = true;

    if (square.isBomb) {
      this.hasExploded.set(true);

      this.squares.forEach((sq) => {
        if (sq.isBomb) {
          sq.isVisible = true;
        }
      });
      square.isRedBomb = true;
    } else if (square.isZero) {
      this.setZero(square);
    }
  }

  setZero({ row, column }: Square): void {
    const squaresAround = this.getPositionsAround(row, column).map(
      (position) => this.squares.find((s) => s.position === position)!
    );

    for (const squareAround of squaresAround) {
      if (
        squareAround.isBomb ||
        (squareAround.isZero && squareAround.isVisible)
      )
        continue;

      squareAround.isVisible = true;

      if (squareAround.isZero) {
        this.setZero(squareAround);
      }
    }
  }

  getPositionsAround(row: number, column: number): string[] {
    const rPositions = [row, row + 1, row - 1];
    const cPositions = [column, column - 1, column + 1];
    const result = [];

    for (const rPosition of rPositions) {
      if (rPosition < 0 || rPosition >= this.boardDimension) continue;

      for (const cPosition of cPositions) {
        if (
          cPosition < 0 ||
          cPosition >= this.boardDimension ||
          (cPosition === column && rPosition === row)
        ) {
          continue;
        }

        result.push(`${rPosition},${cPosition}`);
      }
    }

    return result;
  }

  setSquares(): void {
    const squares: Square[] = [];
    this.setBombsPosition();

    for (let row = 0; row < this.boardDimension; row++) {
      for (let column = 0; column < this.boardDimension; column++) {
        if (this.bombsIndexes.has(`${row},${column}`)) {
          squares.push(new Square(row, column, -1));
        } else {
          const around = this.getPositionsAround(row, column);

          const bombsAround = around.filter((c) =>
            this.bombsIndexes.has(c)
          ).length;

          squares.push(new Square(row, column, bombsAround));
        }
      }
    }

    this.squares = squares;
  }

  setBombsPosition(): void {
    while (this.bombsIndexes.size < this.bombsQuantity) {
      const column = (Math.random() * (this.boardDimension - 1)).toFixed(0);
      const row = (Math.random() * (this.boardDimension - 1)).toFixed(0);

      this.bombsIndexes.add(`${row},${column}`);
    }
  }

  toggleFlag(square: Square, event: MouseEvent) {
    event.preventDefault();

    if (this.hasExploded()) return;

    square.toggleFlag();
  }
}
