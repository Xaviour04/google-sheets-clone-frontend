import { marginSize, updateOverlays } from './index';
import type { ServerLookUpResponse } from './server-response-interfaces';
import { getCellAt, getHeight, getWidth, numberToString } from './utils';

const overlays = document.querySelector('#overlays') as HTMLDivElement;
const textInput = overlays.querySelector('#userinput') as HTMLInputElement;

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Rect(
  x: number,
  y: number,
  width: number,
  height: number,
): Rectangle {
  return { x, y, width, height };
}

export default class Canvas {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private prevData?: ServerLookUpResponse;
  selectedCell?: {
    pos: { row: number; col: number };
    rect: Rectangle;
    editing: boolean;
    text: string;
  };
  offset: { x: number; y: number };
  addEventListener: typeof this.element.addEventListener;

  constructor(element: string | HTMLCanvasElement) {
    if (typeof element === 'string') {
      element = document.querySelector(element) as HTMLCanvasElement;
    }

    this.element = element;
    this.ctx = this.element.getContext('2d')!;
    this.offset = { x: 0, y: 0 };
    this.addEventListener = this.element.addEventListener;

    const mainElem = document.querySelector('main')!;
    mainElem.addEventListener('scroll', () => {
      const { scrollLeft: x, scrollTop: y } = mainElem;
      this.offset = { x, y };
    });
  }

  resize(width?: number, height?: number) {
    if (width) this.element.width = width;
    if (height) this.element.height = height;
  }

  public get width(): number {
    return this.element.width;
  }

  public get height(): number {
    return this.element.height;
  }

  public get style(): CSSStyleDeclaration {
    return this.element.style;
  }

  public setSelectedCell(
    cell?: { row: number; col: number } | undefined | null,
  ) {
    if (typeof cell === 'undefined' || cell === null) {
      this.selectedCell = undefined;
      return;
    }

    let x = marginSize;
    let y = marginSize;

    for (let c = 0; c < cell.col; c++) x += getWidth(c);
    for (let r = 0; r < cell.row; r++) y += getHeight(r);

    if (typeof this.selectedCell === 'undefined') {
      this.element.ondblclick = () => {
        this.selectedCell && (this.selectedCell.editing = true);
        updateOverlays();
      };
    }

    let text = '';
    if (typeof this.prevData !== 'undefined') {
      const isColVisible =
        this.prevData.from.col <= cell.col && cell.col <= this.prevData.to.col;
      const isRowVisible =
        this.prevData.from.row <= cell.row && cell.row <= this.prevData.to.row;

      if (isColVisible && isRowVisible) {
        const row = cell.row - this.prevData.from.row;
        const col = cell.col - this.prevData.from.col;

        text = this.prevData.items[row][col];
      }
    }

    this.selectedCell = {
      pos: cell,
      rect: Rect(x, y, getWidth(cell.col), getHeight(cell.row)),
      editing: false,
      text,
    };

    textInput.value = this.selectedCell.text;

    textInput.dataset.globalX = x + '';
    textInput.dataset.globalY = y + '';

    textInput.style.width = getWidth(cell.col) + 'px';
    textInput.style.height = getHeight(cell.row) + 'px';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
  }

  rect(color: string, rect: Rectangle, width = 0) {
    if (width < 0) return;

    if (width === 0) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      return;
    }

    this.ctx.beginPath();
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
    this.ctx.stroke();
  }

  line(
    color: string,
    start: { x: number; y: number },
    end: { x: number; y: number },
    width: number = 1,
  ) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  }

  drawUI(clear = true) {
    const canvasWidth = this.element.width;
    const canvasHeight = this.element.height;

    const endX = this.offset.x + canvasWidth + marginSize;
    const endY = this.offset.y + canvasHeight + marginSize;

    const {
      row: fromRow,
      col: fromCol,
      offsetX,
      offsetY,
    } = getCellAt(this.offset.x, this.offset.y);
    const { row: toRow, col: toCol } = getCellAt(endX, endY);

    if (clear) {
      this.clear();

      this.rect('#111213', Rect(0, 0, canvasWidth, canvasHeight));

      this.rect(
        '#0d0d0d',
        Rect(marginSize, marginSize, canvasWidth, canvasHeight),
      );
    } else {
      this.rect('#111213', Rect(0, 0, canvasWidth, marginSize));
      this.rect('#111213', Rect(0, 0, marginSize, canvasHeight));
    }

    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = '#969a9f';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let x = -offsetX + marginSize;
    for (let col = fromCol; col < toCol; col++) {
      const width = getWidth(col);
      const str = numberToString(col + 1);

      this.ctx.fillText(str, x + width / 2, marginSize / 2);

      x += width;
      this.line('#252525', { x, y: 0 }, { x, y: canvasHeight });
    }

    let y = -offsetY + marginSize;
    for (let row = fromRow; row < toRow; row++) {
      const height = getHeight(row);
      this.ctx.fillText(row + 1 + '', marginSize / 2, y + height / 2);
      y += height;
      this.line('#252525', { x: 0, y }, { x: canvasWidth, y });
    }

    this.rect('#111213', Rect(0, 0, marginSize, marginSize));

    this.line(
      '#454545',
      { x: 0, y: marginSize },
      { x: canvasWidth, y: marginSize },
    );
    this.line(
      '#454545',
      { x: marginSize, y: 0 },
      { x: marginSize, y: canvasHeight },
    );
  }

  putDataIntoTable(data?: ServerLookUpResponse) {
    data = data ?? this.prevData;
    this.prevData = data;

    if (typeof data === 'undefined') return;

    this.drawUI(true);

    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = 'rgb(255, 255, 255)';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let globalX = 0;
    let globalY = 0;

    for (let col = 0; col < data.from.col; col++) globalX += getWidth(col);
    for (let row = 0; row < data.from.row; row++) globalY += getHeight(row);

    const startGlobalX = globalX;

    for (let row = data.from.row; row < data.to.row; row++) {
      const relativeY = globalY - this.offset.y + marginSize;
      const height = getHeight(row);

      globalY += height;
      globalX = startGlobalX;

      for (let col = data.from.col; col < data.to.col; col++) {
        const relativeX = globalX - this.offset.x + marginSize;
        const width = getWidth(col);

        globalX += width;

        this.ctx.fillText(
          data.items[row - data.from.row][col - data.from.col],
          relativeX + width / 2,
          relativeY + height / 2,
        );
      }
    }

    this.drawUI(false);
  }
}
