export interface TableConfig {
  ID: string;
  Title: string;
  Cols: number;
  Rows: number;

  DefaultWidth: number;
  WidthChanges: { [col: number]: number };

  DefaultHeight: number;
  HeightChanges: { [row: number]: number };
}

export interface ServerLookUpResponse {
  from: {
    row: number;
    col: number;
  };
  to: {
    row: number;
    col: number;
  };
  items: Array<Array<string>>;
}
