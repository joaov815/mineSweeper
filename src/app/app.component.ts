import { Component, computed, OnInit, signal } from '@angular/core';
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
  squares: Square[] = [];
  level = signal<GameLevelEnum>(GameLevelEnum.EASY);
  hasExploded = signal(false);
  hasWon = signal(false);
  loading = signal(false);
  isLoading = signal(false);
  gameTimeInSeconds = signal(0);
  bombsIndexes: Set<string> = new Set();
  boardDimension = 9;
  bombsQuantity = signal(10);
  flagsPlaced = signal(0);
  bombsLeft = computed(() =>
    Math.max(this.bombsQuantity() - this.flagsPlaced(), 0)
  );
  gameInterval!: any;
  gameStarted = false;

  ngOnInit(): void {
    this.reset();
  }

  startTimer(): void {
    this.gameStarted = true;
    this.gameInterval = setInterval(() => {
      this.gameTimeInSeconds.update((val) => val + 1);
    }, 1000);
  }

  reset(): void {
    this.gameStarted = false;
    this.isLoading.set(true);
    this.gameTimeInSeconds.set(0);

    this.hasExploded.set(false);
    this.bombsIndexes = new Set();
    this.setSquares();

    this.isLoading.set(false);
  }

  select(square: Square): void {
    if (square.isFlag || this.hasExploded()) return;
    if (!this.gameTimeInSeconds() && !this.gameStarted) this.startTimer();

    square.isVisible = true;

    if (square.isBomb) {
      this.hasExploded.set(true);
      clearInterval(this.gameInterval);

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

    const result: string[] = [];

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
    this.squares = [];
    this.setBombsPosition();

    for (let row = 0; row < this.boardDimension; row++) {
      for (let column = 0; column < this.boardDimension; column++) {
        if (this.bombsIndexes.has(`${row},${column}`)) {
          this.squares.push(new Square(row, column, -1));
        } else {
          const around = this.getPositionsAround(row, column);

          const bombsAround = around.filter((c) =>
            this.bombsIndexes.has(c)
          ).length;

          this.squares.push(new Square(row, column, bombsAround));
        }
      }
    }
  }

  setBombsPosition(): void {
    while (this.bombsIndexes.size < this.bombsQuantity()) {
      const column = (Math.random() * (this.boardDimension - 1)).toFixed(0);
      const row = (Math.random() * (this.boardDimension - 1)).toFixed(0);

      this.bombsIndexes.add(`${row},${column}`);
    }
  }

  toggleFlag(square: Square, event: MouseEvent) {
    event.preventDefault();

    if (this.hasExploded()) return;
    if (!this.gameTimeInSeconds() && !this.gameStarted) this.startTimer();

    square.toggleFlag();
    this.flagsPlaced.update((v) => (square.isFlag ? v + 1 : v - 1));
  }
}
