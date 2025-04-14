import { Component, computed, OnInit, signal } from '@angular/core';

class Square {
  constructor(
    public row: number,
    public column: number,
    public value: number
  ) {}

  isVisible = false;
  isFlag = false;

  toggleFlag(e?: MouseEvent) {
    e?.preventDefault();
    this.isFlag = !this.isFlag;
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  get isRightFlag(): boolean {
    return this.isBomb && this.isFlag;
  }

  get isBomb(): boolean {
    return this.value === -1;
  }

  get isZero(): boolean {
    return this.value === 0;
  }
}

enum GameLevelEnum {
  EASY,
  MEDIUM,
  HARD,
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'minesweeper';
  squares = signal<Square[][]>([]);
  level = signal<GameLevelEnum>(GameLevelEnum.EASY);
  bombsIndexes: Set<string> = new Set();
  hasExploded = signal(false);
  loading = signal(false);
  isLoading = signal(false);
  hasWon = signal(false);

  get rows(): number {
    return [9, 20, 30][this.level()];
  }

  get columns(): number {
    return [9, 20, 30][this.level()];
  }

  get bombsQuantity(): number {
    return [1, 40, 99][this.level()];
  }

  ngOnInit() {
    this.reset();
  }

  reset() {
    this.isLoading.set(true);

    this.hasExploded.set(false);
    this.bombsIndexes = new Set();
    this.setSquares();

    this.isLoading.set(false);
  }

  select(square: Square) {
    if (square.isFlag) return;

    square.toggleVisibility();

    if (square.isBomb) {
      this.hasExploded.set(true);
    } else if (square.isZero) {
      this.setZero(square);
    }
  }

  setZero({ row, column }: Square): void {
    const squaresAround = this.getPositionsAround(row, column).map(
      (position) => {
        const [pRow, pColumn] = position.split(',').map(Number);

        return this.squares()[pRow][pColumn];
      }
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
    const rPositions = [
      row,
      row + 1, // top
      row - 1, // bottom
    ];
    const cPositions = [
      column,
      column - 1, // left
      column + 1, // right
    ];

    const pos = [];

    for (const rPosition of rPositions) {
      if (rPosition < 0 || rPosition >= this.rows) continue;

      for (const cPosition of cPositions) {
        if (
          cPosition < 0 ||
          cPosition >= this.columns ||
          (cPosition === column && rPosition === row)
        ) {
          continue;
        }

        pos.push(`${rPosition},${cPosition}`);
      }
    }

    return pos;
  }

  setSquares() {
    const squares: Square[][] = [];
    this.setBombsPosition();

    for (let row = 0; row < this.rows; row++) {
      squares[row] ??= [];

      for (let column = 0; column < this.columns; column++) {
        if (this.bombsIndexes.has(`${row},${column}`)) {
          squares[row].push(new Square(row, column, -1));
        } else {
          const around = this.getPositionsAround(row, column);

          const bombsAround = around.filter((c) =>
            this.bombsIndexes.has(c)
          ).length;

          squares[row].push(new Square(row, column, bombsAround));
        }
      }
    }

    this.squares.set(squares);
  }

  setBombsPosition() {
    while (this.bombsIndexes.size < this.bombsQuantity) {
      const column = (Math.random() * this.columns).toFixed(0);
      const row = (Math.random() * this.rows).toFixed(0);

      this.bombsIndexes.add(`${row},${column}`);
    }
  }
}
