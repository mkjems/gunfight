export type LobbySlot = {
    label: string;
    ready: boolean;
};

export type LobbyComponentProps = {
    controls?: string[];
    editPrompt?: string;
    identityLines?: string[];
    playPrompt?: string;
    showControls?: boolean;
    showEditPrompt?: boolean;
    slots?: LobbySlot[];
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
            <h1>GUNFIGHT 1975</h1>
            <div id="lobbyInstructions">
                <div id="lobbyControlsText" hidden={!options.showControls}>
                    <Lines lines={options.controls || []} />
                </div>
                <div id="lobbyEditPrompt" hidden={!options.showEditPrompt}>
                    <Text text={options.editPrompt || ''} />
                </div>
                <div id="lobbyPlayPrompt" className="blink-text">
                    <Text text={options.playPrompt || ''} />
                </div>
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
