import { canvas, config } from './index';

export function numberToString(value: number): string {
  const A = 65; // ascii value of "A"

  let str = '';
  while (value > 0) {
    let charDigit = value % 27;
    value = (value - charDigit) / 27;

    let char = String.fromCharCode(charDigit + A - 1);
    str = char + str;
  }

  return str;
}

export const getWidth = (col: number) =>
  config.WidthChanges[col] ?? config.DefaultWidth;
export const getHeight = (row: number) =>
  config.HeightChanges[row] ?? config.DefaultHeight;

export function getCellAt(
  x: number,
  y: number,
): { row: number; col: number; offsetX: number; offsetY: number } {
  let row = 0;
  let col = 0;
  let offsetX = 0;
  let offsetY = 0;

  let i = 0;
  while (i < x) {
    offsetX = x - i;
    i += getWidth(col);
    if (i < x) col++;
  }

  let j = 0;
  while (j < y) {
    offsetY = y - j;
    j += getHeight(row);
    if (j < y) row++;
  }
  return { row, col, offsetX, offsetY };
}

// export function getCellPosFromName(name: string): { row: number; col: number } {
//   let col = 0;
//   let row = 0;

//   const A = 65; // char code of "A"
//   const _0 = 48; // char code of "0"

//   for (let i = 0; i < name.length; i++) {
//     let char = name[i];

//     if (/^[a-zA-Z]+$/.test(char)) {
//       char = char.toUpperCase();
//       col = col * 27 + (char.charCodeAt(0) - A + 1);
//       continue;
//     }

//     if (/^[0-9]+$/.test(char)) {
//       row = row * 10 + (char.charCodeAt(0) - _0);
//       continue;
//     }

//     throw new Error('invalid character found in cell name');
//   }

//   // "-1" because usually the UI starts counting rows and columns from 1
//   return { row: row - 1, col: col - 1 };
// }
