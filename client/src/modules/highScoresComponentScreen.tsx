import { render as renderComponent } from 'preact';
import { arePropsEqual } from './componentRenderProps.js';

type HighScoreRow = {
    deaths: number;
    kills: number;
    name: string;
    wins: number;
};

type HighScoresComponentScreenElements = {
    lobbyMain?: HTMLElement | null;
    playPrompt?: HTMLElement | null;
    screen?: HTMLElement | null;
    table?: HTMLElement | null;
};

type HighScoresComponentScreenRenderOptions = {
    playPrompt?: string;
    rows?: HighScoreRow[];
};

type HighScoresTableProps = {
    rows: HighScoreRow[];
};

type HighScoresPromptProps = {
    text: string;
};

export class HighScoresComponentScreen {
    elements: HighScoresComponentScreenElements;
    lastRenderedOptions?: HighScoresComponentScreenRenderOptions;

    constructor(elements: HighScoresComponentScreenElements = {}) {
        this.elements = elements;
    }

    render(options: HighScoresComponentScreenRenderOptions = {}) {
        show(this.elements.lobbyMain, false);
        show(this.elements.screen, true);

        if (
            this.lastRenderedOptions &&
            arePropsEqual(this.lastRenderedOptions, options)
        ) {
            return false;
        }

        if (this.elements.table) {
            renderComponent(
                <HighScoresTable rows={options.rows || []} />,
                this.elements.table
            );
        }

        if (this.elements.playPrompt) {
            renderComponent(
                <HighScoresPrompt text={options.playPrompt || ''} />,
                this.elements.playPrompt
            );
        }

        this.lastRenderedOptions = options;

        return true;
    }
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

function show(element: HTMLElement | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}
