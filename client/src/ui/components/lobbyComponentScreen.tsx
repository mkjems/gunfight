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
    return (
        <>
            <div class="lobbyInstructions">
                <h1>GUNFIGHT 1975</h1>
                <div id="lobbyControlsText" hidden={!options.showControls}>
                    <Lines lines={options.controls || []} />
                </div>
                <div id="lobbyEditPrompt" hidden={!options.showEditPrompt}>
                    <Text text={options.editPrompt || ''} />
                </div>
                <div id="lobbyHighScoresPrompt">
                    <Text text={options.highScoresPrompt || ''} />
                </div>
                <div id="lobbyPlayPrompt" className="blink-text">
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
