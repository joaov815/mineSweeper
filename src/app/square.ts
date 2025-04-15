export class Square {
  constructor(
    public row: number,
    public column: number,
    public value: number
  ) {}

  isVisible = false;
  isFlag = false;
  isRedBomb = false;

  toggleFlag() {
    this.isFlag = !this.isFlag;
  }

  toggleVisibility(value?: boolean) {
    this.isVisible = !this.isVisible;
  }

  get isRightFlag(): boolean {
    return this.isBomb && this.isFlag;
  }

  get position(): string {
    return `${this.row},${this.column}`;
  }

  get isBomb(): boolean {
    return this.value === -1;
  }

  get isZero(): boolean {
    return this.value === 0;
  }

  get bg(): string {
    if (this.value >= 0 && this.isVisible) return `s_${this.value}`;
    if (this.isRedBomb) return 'mine_red';

    const conditions: Record<string, boolean> = {
      mine: this.isVisible && this.isBomb,
      flag: this.isFlag,
      mine_red: this.isRedBomb,
    };

    for (const [img, val] of Object.entries(conditions)) {
      if (val) return img;
    }

    return 'closed';
  }
}
