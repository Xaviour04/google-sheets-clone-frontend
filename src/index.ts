import Canvas from './Canvas';
import { connectWS } from './server-conn';
import type { TableConfig } from './server-response-interfaces';
import { getCellAt, getWidth, getHeight, numberToString } from './utils';

const mainElem = document.querySelector('main') as HTMLElement;
const xAxis = document.querySelector('#x-axis') as HTMLSpanElement;
const yAxis = document.querySelector('#y-axis') as HTMLSpanElement;

const overlays = document.querySelector('#overlays') as HTMLDivElement;
const textInput = overlays.querySelector('#userinput') as HTMLInputElement;

const titleInputElem = document.querySelector('#filename') as HTMLInputElement;

export const canvas = new Canvas('#main-table-canvas');
export const marginSize: number = 32;

export var config: TableConfig = JSON.parse(
  document.body.dataset.config!,
) as TableConfig;
let wsConn: WebSocket;

export function updateOverlays() {
  const { x, y } = canvas.offset;

  overlays.style.width = canvas.width + 'px';
  overlays.style.height = canvas.height + 'px';

  [...overlays.children].forEach((_elem) => {
    const elem = _elem as HTMLElement;
    const globalX = parseInt(elem.dataset.globalX || '0');
    const globalY = parseInt(elem.dataset.globalY || '0');

    const translateX = globalX - x - marginSize + 'px';
    const translateY = `calc(${globalY - y}px - ${
      getComputedStyle(elem).height
    })`;

    elem.style.transform = `translate(${translateX}, ${translateY})`;
  });

  const selected = canvas.selectedCell;

  if (selected && selected.editing) textInput.style.pointerEvents = 'initial';
}

function updateDataOnCanvas() {
  const { x, y } = canvas.offset;
  requestAnimationFrame(() => {
    canvas.putDataIntoTable();
  });

  updateOverlays();

  const from = getCellAt(x, y);
  const to = getCellAt(x + canvas.width, y + canvas.height);

  wsConn.send(
    'look-up ' +
      JSON.stringify({
        from: { row: from.row, col: from.col },
        to: { row: to.row, col: to.col },
      }),
  );
}

window.onload = () => {
  titleInputElem.value = config.Title;

  let tableWidth = marginSize;
  let tableHeight = marginSize;

  for (let col = 0; col < config.Cols; col++) tableWidth += getWidth(col);
  for (let row = 0; row < config.Rows; row++) tableHeight += getHeight(row);

  xAxis.style.width = tableWidth + 'px';
  yAxis.style.height = tableHeight + 'px';

  overlays.style.marginLeft = marginSize + 'px';
  overlays.style.marginTop = marginSize + 'px';

  wsConn = connectWS(config.ID, {
    open: () => {
      canvas.resize(mainElem.clientWidth, mainElem.clientHeight);
      updateDataOnCanvas();

      mainElem.addEventListener('scroll', updateDataOnCanvas, {
        passive: true,
      });
      window.onresize = () => {
        canvas.resize(mainElem.clientWidth, mainElem.clientHeight);
        updateDataOnCanvas();
      };
    },

    message: (msg) => canvas.putDataIntoTable(msg),
  });

  canvas.element.addEventListener('click', ({ offsetX, offsetY }) => {
    const x = offsetX - marginSize + canvas.offset.x;
    const y = offsetY - marginSize + canvas.offset.y;

    const { row, col } = getCellAt(x, y);
    canvas.setSelectedCell({ row, col });

    updateOverlays();
  });

  textInput.addEventListener('change', () => {
    const cell = canvas.selectedCell!;

    wsConn.send(
      'update-value ' +
        JSON.stringify({
          row: cell.pos.row || 0,
          col: cell.pos.col || 0,
          value: textInput.value,
        }),
    );

    cell.editing = false;
    canvas.setSelectedCell({ row: cell.pos.row, col: cell.pos.col + 1 });
    cell.editing = true;
    updateDataOnCanvas();
  });
};
