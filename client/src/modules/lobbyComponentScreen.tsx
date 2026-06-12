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

type LobbySlotsProps = {
    slots: LobbySlot[];
};

type TextProps = {
    text: string;
};

export function LobbyMain(options: LobbyComponentProps = {}) {
    return (
        <>
            <h1>GUNFIGHT 1975</h1>
            <div className="lobby-section">
                <div id="lobbyIdentity">
                    <Lines lines={options.identityLines || []} />
                </div>
            </div>
            <div className="lobby-section" hidden={!options.showControls}>
                <div id="lobbyControlsText">
                    <Lines lines={options.controls || []} />
                </div>
            </div>
            <div className="lobby-section">
                <div id="lobbySlots">
                    <LobbySlots slots={options.slots || []} />
                </div>
            </div>
            <div className="lobby-section">
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

function LobbySlots(props: LobbySlotsProps) {
    return (
        <>
            {props.slots.map(function (slot, index) {
                return (
                    <div
                        className={
                            'lobby-slot' + (slot.ready ? ' negative-text' : '')
                        }
                        key={index}
                    >
                        {slot.label}
                    </div>
                );
            })}
        </>
    );
}

function Text(props: TextProps) {
    return <>{props.text}</>;
}
