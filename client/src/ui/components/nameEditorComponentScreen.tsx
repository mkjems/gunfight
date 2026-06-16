import styles from './nameEditorComponentScreen.module.css';

export type NameEditorState = {
    cursorCol?: number;
    cursorRow?: number;
    grid?: string[][];
    name?: string;
};

export type NameEditorProps = {
    helpLines?: string[];
    onSelect?: (rowIndex: number, colIndex: number) => void;
    state?: NameEditorState;
};

type NameEditorGridProps = {
    cursorCol: number;
    cursorRow: number;
    grid: string[][];
    onSelect?: (rowIndex: number, colIndex: number) => void;
};

type LinesProps = {
    lines: string[];
};

const emptyState: Required<NameEditorState> = {
    cursorCol: 0,
    cursorRow: 0,
    grid: [],
    name: ''
};

export function NameEditorComponent(props: NameEditorProps = {}) {
    const state = {
        ...emptyState,
        ...(props.state || {})
    };

    return (
        <>
            <h1>GUNFIGHT 1975</h1>
            <div className={styles.value} id="nameEditorValue">
                NAME: {state.name || ' '}
            </div>
            <div className={styles.grid} id="nameEditorGrid">
                <NameEditorGrid
                    cursorCol={state.cursorCol}
                    cursorRow={state.cursorRow}
                    grid={state.grid}
                    onSelect={props.onSelect}
                />
            </div>
            <div className={styles.help} id="nameEditorHelp">
                <Lines lines={props.helpLines || []} />
            </div>
        </>
    );
}

function NameEditorGrid(props: NameEditorGridProps) {
    return (
        <>
            {props.grid.map(function (row, rowIndex) {
                return (
                    <div className={getRowClassName(row)} key={rowIndex}>
                        {row.map(function (value, colIndex) {
                            const selected =
                                props.cursorRow === rowIndex &&
                                props.cursorCol === colIndex;

                            return (
                                <button
                                    className={getKeyClassName(selected)}
                                    key={value}
                                    onPointerDown={function (evt) {
                                        evt.preventDefault();
                                        props.onSelect?.(rowIndex, colIndex);
                                    }}
                                    type="button"
                                >
                                    {value}
                                </button>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}

function getRowClassName(row: string[]) {
    return [styles.row, row.length < 9 ? styles.shortRow : '']
        .filter(Boolean)
        .join(' ');
}

function getKeyClassName(selected: boolean) {
    return [styles.key, selected ? styles.selectedKey : '']
        .filter(Boolean)
        .join(' ');
}

function Lines(props: LinesProps) {
    return (
        <>
            {props.lines
                .filter(function (line) {
                    return line;
                })
                .map(function (line, index) {
                    return <div key={index}>{line}</div>;
                })}
        </>
    );
}
