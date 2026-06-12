export type HighScoreRow = {
    deaths: number;
    kills: number;
    name: string;
    wins: number;
};

export type HighScoresProps = {
    playPrompt?: string;
    rows?: HighScoreRow[];
};

type HighScoresTableProps = {
    rows: HighScoreRow[];
};

type HighScoresPromptProps = {
    text: string;
};

export function HighScoresScreen(options: HighScoresProps = {}) {
    return (
        <>
            <h1>HIGH SCORES</h1>
            <div id="highScoresTable">
                <HighScoresTable rows={options.rows || []} />
            </div>
            <div id="highScoresPlayPrompt" className="blink-text">
                <HighScoresPrompt text={options.playPrompt || ''} />
            </div>
        </>
    );
}

function HighScoresTable(props: HighScoresTableProps) {
    return (
        <>
            <HighScoresRow
                isHeader={true}
                values={['NAME', 'WINS', 'KILLS', 'DEATHS']}
            />
            {props.rows.length ? (
                props.rows.map(function (row) {
                    return (
                        <HighScoresRow
                            key={row.name}
                            values={[row.name, row.wins, row.kills, row.deaths]}
                        />
                    );
                })
            ) : (
                <div className="high-score-empty">NO SCORES YET</div>
            )}
        </>
    );
}

function HighScoresRow(props: { isHeader?: boolean; values: unknown[] }) {
    return (
        <div
            className={'high-score-row' + (props.isHeader ? ' is-header' : '')}
        >
            {props.values.map(function (value, index) {
                return <span key={index}>{String(value)}</span>;
            })}
        </div>
    );
}

function HighScoresPrompt(props: HighScoresPromptProps) {
    return <>{props.text}</>;
}
