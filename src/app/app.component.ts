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
  gameStarted = signal(false);
  gameOver = computed(() => this.hasWon() || this.hasExploded());
  bombsLeft = computed(() =>
    Math.max(this.bombsQuantity() - this.flagsPlaced(), 0)
  );
  gameInterval!: any;

  ngOnInit(): void {
    this.reset();
  }

  select(square: Square): void {
    if (square.isFlag || this.gameOver()) return;
    if (!this.gameTimeInSeconds() && !this.gameStarted()) this._startTimer();

    square.isVisible = true;

    if (square.isBomb) {
      this._endGame(false);

      square.isRedBomb = true;

      return;
    }

    if (square.isZero) this._setZero(square);

    this._checkHasWon();
  }

  toggleFlag(square: Square, event: MouseEvent) {
    event.preventDefault();

    if (this.hasExploded()) return;
    if (!this.gameTimeInSeconds() && !this.gameStarted()) this._startTimer();

    square.toggleFlag();

    this.flagsPlaced.update((v) => (square.isFlag ? v + 1 : v - 1));
  }

  reset(): void {
    clearInterval(this.gameInterval);

    this.gameStarted.set(false);
    this.isLoading.set(true);
    this.gameTimeInSeconds.set(0);
    this.flagsPlaced.set(0);

    this.hasWon.set(false);
    this.hasExploded.set(false);
    this._setSquares();

    this.isLoading.set(false);
  }

  private _checkHasWon(): void {
    const hasWon =
      this.squares.filter((s) => !s.isVisible).length === this.bombsQuantity();

    if (hasWon) this._endGame(hasWon);
  }

  private _endGame(hasWon: boolean) {
    this.hasWon.set(hasWon);
    this.hasExploded.set(!hasWon);

    clearInterval(this.gameInterval);

    if (this.hasExploded()) {
      this.squares.forEach((sq) => {
        sq.isVisible = sq.isVisible || sq.isBomb;
      });
    } else {
      this.squares.forEach((s) => {
        if (s.isBomb) s.isFlag = true;
      });
      this.flagsPlaced.set(this.bombsQuantity());
    }
  }

  private _startTimer(): void {
    this.gameStarted.set(true);
    this.gameInterval = setInterval(() => {
      this.gameTimeInSeconds.update((val) => val + 1);
    }, 1000);
  }

  private _setZero({ row, column }: Square): void {
    const squaresAround = this._getPositionsAround(row, column).map(
      (position) => this.squares.find((s) => s.position === position)!
    );

    for (const square of squaresAround) {
      const { isBomb, isZero, isVisible } = square;

      if (isBomb || (isZero && isVisible)) continue;

      square.isVisible = true;

      if (isZero) this._setZero(square);
    }
  }

  private _getPositionsAround(row: number, column: number): string[] {
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

  private _setSquares(): void {
    this.squares = [];
    this.bombsIndexes = new Set();

    const getRandomAxis = () =>
      (Math.random() * (this.boardDimension - 1)).toFixed(0);

    // set bombs position
    while (this.bombsIndexes.size < this.bombsQuantity()) {
      this.bombsIndexes.add(`${getRandomAxis()},${getRandomAxis()}`);
    }

    // set squares
    for (let row = 0; row < this.boardDimension; row++) {
      for (let column = 0; column < this.boardDimension; column++) {
        let squareValue = 0;

        if (this.bombsIndexes.has(`${row},${column}`)) {
          squareValue = -1;
        } else {
          squareValue = this._getPositionsAround(row, column).filter((c) =>
            this.bombsIndexes.has(c)
          ).length;
        }

        this.squares.push(new Square(row, column, squareValue));
      }
    }
  }
}
