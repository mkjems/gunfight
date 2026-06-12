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
                values={['PLACE', 'NAME', 'WINS', 'KILLS', 'DEATHS']}
            />
            {getHighScoreRows(props.rows).map(function (row, index) {
                return (
                    <HighScoresRow
                        key={getPlaceLabel(index)}
                        values={[
                            getPlaceLabel(index),
                            row?.name || '',
                            row?.wins ?? '',
                            row?.kills ?? '',
                            row?.deaths ?? ''
                        ]}
                    />
                );
            })}
        </>
    );
}

function getHighScoreRows(rows: HighScoreRow[]) {
    return Array.from({ length: 10 }, function (_, index) {
        return rows[index] || null;
    });
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

function getPlaceLabel(index: number) {
    const place = index + 1;

    if (place === 1) {
        return '1ST';
    }

    if (place === 2) {
        return '2ND';
    }

    if (place === 3) {
        return '3RD';
    }

    return place + 'TH';
}
