import { Component, computed, OnInit, signal } from '@angular/core';

class Square {
  constructor(public x: number, public y: number, public value: number) {}

  isVisible = false;
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

  get rows(): number {
    return [9, 20, 30][this.level()];
  }

  get columns(): number {
    return [9, 20, 30][this.level()];
  }

  get bombsQuantity(): number {
    return [10, 40, 99][this.level()];
  }

  ngOnInit() {
    this.setSquares();
  }

  setSquares() {
    const squares: Square[][] = [];
    this.setBombsPosition();

    for (let row = 0; row < this.rows; row++) {
      squares[row] ??= [];
      for (let column = 0; column < this.columns; column++) {
        // squares[column] ??= [];
        if (this.bombsIndexes.has(`${row}${column}`)) {
          squares[row].push(new Square(row, column, -1));
        } else {
          const around = [
            `${row - 1}${column - 1}`, // top-left
            `${row - 1}${column}`, // top
            `${row - 1}${column + 1}`, // top-right
            `${row}${column + 1}`, // right
            `${row + 1}${column + 1}`, // bottom-right
            `${row + 1}${column}`, // bottom
            `${row + 1}${column - 1}`, // bottom-left
            `${row}${column - 1}`, // left
          ];

          if (row === 0 && column === 0) {
            console.log(around);
          }

          const bombsAround = around.filter((c) => {
            if (row === 0 && column === 0) {
              console.log(this.bombsIndexes.has(c));
            }
            return this.bombsIndexes.has(c);
          }).length;

          squares[row].push(new Square(row, column, bombsAround));
        }
      }
    }

    console.log(squares);

    this.squares.set(squares);
  }

  // choose
  setBombsPosition() {
    while (this.bombsIndexes.size < this.bombsQuantity) {
      const cIdx = (Math.random() * this.columns).toFixed(0);
      const rIdx = (Math.random() * this.rows).toFixed(0);

      this.bombsIndexes.add(rIdx + cIdx);
    }
  }

  setNumbers() {}
}
