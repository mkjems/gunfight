import { ScoreRow, type ScoreRowProps } from './gameHudComponentScreen.js';

export type LobbySlot = {
    label: string;
    ready: boolean;
};

export type LobbyComponentProps = {
    controls?: string[];
    editPrompt?: string;
    highScoresPrompt?: string;
    identityLines?: string[];
    opponentPlaceholder?: LobbyTextLine[];
    playerLabels?: LobbyTextLine[];
    playPrompt?: string;
    previousResult?: ScoreRowProps | null;
    showControls?: boolean;
    showEditPrompt?: boolean;
    slots?: LobbySlot[];
};

export type LobbyTextLine = {
    key: string;
    negative?: boolean;
    text: string;
    variant?:
        | 'opponent-placeholder-marker'
        | 'opponent-placeholder-message'
        | 'player-status';
    x: number;
    y: number;
};

type LinesProps = {
    lines: string[];
};

type TextProps = {
    text: string;
};

export function LobbyMain(options: LobbyComponentProps = {}) {
    const reserveDesktopPrompts = !!options.showControls;

    return (
        <>
            <LobbyPreviousResult result={options.previousResult} />
            <div class="lobbyInstructions">
                <h1>GUNFIGHT 1975</h1>
                <div id="lobbyControlsText" hidden={!options.showControls}>
                    <Lines lines={options.controls || []} />
                </div>
                <div
                    aria-hidden={!options.showEditPrompt}
                    className={getPromptClassName(!!options.showEditPrompt)}
                    hidden={!reserveDesktopPrompts && !options.showEditPrompt}
                    id="lobbyEditPrompt"
                >
                    <Text text={options.editPrompt || ''} />
                </div>
                <div
                    aria-hidden={!options.highScoresPrompt}
                    className={getPromptClassName(!!options.highScoresPrompt)}
                    hidden={!reserveDesktopPrompts && !options.highScoresPrompt}
                    id="lobbyHighScoresPrompt"
                >
                    <Text text={options.highScoresPrompt || ''} />
                </div>
                <div
                    aria-hidden={!options.playPrompt}
                    className={
                        'blink-text ' + getPromptClassName(!!options.playPrompt)
                    }
                    hidden={!reserveDesktopPrompts && !options.playPrompt}
                    id="lobbyPlayPrompt"
                >
                    <Text text={options.playPrompt || ''} />
                </div>
            </div>
            <div id="lobbyPlayerLabels">
                <LobbyPlayerLabels
                    labels={[
                        ...(options.playerLabels || []),
                        ...(options.opponentPlaceholder || [])
                    ]}
                />
            </div>
        </>
    );
}

function LobbyPreviousResult(props: { result?: ScoreRowProps | null }) {
    if (!props.result) {
        return null;
    }

    return (
        <div id="lobbyPreviousResult">
            <ScoreRow {...props.result} idPrefix="lobbyPrevious" />
        </div>
    );
}

function getPromptClassName(visible: boolean) {
    return 'lobbyPromptSlot' + (visible ? '' : ' is-reserved-hidden');
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

function Text(props: TextProps) {
    return <>{props.text}</>;
}

function LobbyPlayerLabels(props: { labels: LobbyTextLine[] }) {
    return (
        <>
            {props.labels.map(function (label) {
                return (
                    <div
                        className={
                            'lobby-player-label' +
                            (label.variant ? ' is-' + label.variant : '') +
                            (label.negative ? ' negative-text' : '')
                        }
                        key={label.key}
                        style={{
                            left: label.x + '%',
                            top: label.y + '%'
                        }}
                    >
                        {label.text}
                    </div>
                );
            })}
        </>
    );
}
