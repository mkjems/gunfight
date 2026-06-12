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
            <div id="nameEditorValue">NAME: {state.name || ' '}</div>
            <div id="nameEditorGrid">
                <NameEditorGrid
                    cursorCol={state.cursorCol}
                    cursorRow={state.cursorRow}
                    grid={state.grid}
                    onSelect={props.onSelect}
                />
            </div>
            <div id="nameEditorHelp">
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
                    <div
                        className={
                            'name-editor-row' +
                            (row.length < 9 ? ' is-short' : '')
                        }
                        key={rowIndex}
                    >
                        {row.map(function (value, colIndex) {
                            return (
                                <button
                                    className={
                                        'name-editor-key' +
                                        (props.cursorRow === rowIndex &&
                                        props.cursorCol === colIndex
                                            ? ' is-selected negative-text'
                                            : '')
                                    }
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
