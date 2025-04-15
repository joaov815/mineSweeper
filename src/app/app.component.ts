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
  imports: [CounterComponent, NgClass, NgStyle],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  squares: Square[] = [];
  bombsIndexes: Set<string> = new Set();
  gameInterval!: any;

  level = signal(GameLevelEnum.EASY);
  hasWon = signal(false);
  hasExploded = signal(false);
  buttonPressed = signal(false);
  gameStarted = signal(false);
  gameTimeInSeconds = signal(0);
  bombsQuantity = signal(10);
  boardDimension = signal(9);
  flagsPlaced = signal(0);

  gameOver = computed(() => this.hasWon() || this.hasExploded());
  bombsLeft = computed(() =>
    Math.max(this.bombsQuantity() - this.flagsPlaced(), 0)
  );

  ngOnInit(): void {
    this.reset();
  }

  setLevel(level: GameLevelEnum): void {
    this.level.set(level);

    this.boardDimension.set([9, 16, 30][level]);
    this.bombsQuantity.set([10, 40, 99][level]);

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

  toggleFlag(square: Square, event: MouseEvent): void {
    event.preventDefault();

    if (this.gameOver() || square.isVisible) return;
    if (!this.gameTimeInSeconds() && !this.gameStarted()) this._startTimer();

    square.toggleFlag();

    this.flagsPlaced.update((v) => (square.isFlag ? v + 1 : v - 1));
  }

  reset(): void {
    clearInterval(this.gameInterval);

    this.hasWon.set(false);
    this.hasExploded.set(false);
    this.gameStarted.set(false);
    this.gameTimeInSeconds.set(0);
    this.flagsPlaced.set(0);

    this.squares = [];
    this.bombsIndexes = new Set();

    this._setSquares();
  }

  private _checkHasWon(): void {
    const hasWon =
      this.squares.filter((s) => !s.isVisible).length === this.bombsQuantity();

    if (hasWon) this._endGame(hasWon);
  }

  private _endGame(hasWon: boolean): void {
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
    const rows = [row, row + 1, row - 1];
    const columns = [column, column - 1, column + 1];

    const result: string[] = [];
    const isInvalidAxis = (a: number) => a < 0 || a >= this.boardDimension();

    for (const r of rows) {
      if (isInvalidAxis(r)) continue;

      for (const c of columns) {
        if (isInvalidAxis(c) || (c === column && r === row)) {
          continue;
        }

        result.push(`${r},${c}`);
      }
    }

    return result;
  }

  private _setSquares(): void {
    const getRandomAxis = () =>
      (Math.random() * (this.boardDimension() - 1)).toFixed(0);

    // set bombs position
    while (this.bombsIndexes.size < this.bombsQuantity()) {
      this.bombsIndexes.add(`${getRandomAxis()},${getRandomAxis()}`);
    }

    // set squares
    for (let s = 0; s < this.boardDimension() ** 2; s++) {
      const row = Math.floor(s / this.boardDimension());
      const column = s % this.boardDimension();
      let squareValue = -1;

      if (!this.bombsIndexes.has(`${row},${column}`)) {
        squareValue = this._getPositionsAround(row, column).filter((c) =>
          this.bombsIndexes.has(c)
        ).length;
      }

      this.squares.push(new Square(row, column, squareValue));
    }
  }
}
