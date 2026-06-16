import { ScoreRow, type ScoreRowProps } from './gameHudComponentScreen.js';
import styles from './lobbyComponentScreen.module.css';

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
            <div className={styles.instructions}>
                <h1 className={styles.title}>GUNFIGHT 1975</h1>
                <div
                    className={styles.controlsText}
                    id="lobbyControlsText"
                    hidden={!options.showControls}
                >
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
                    className={getClassName([
                        'blink-text',
                        getPromptClassName(!!options.playPrompt)
                    ])}
                    hidden={!reserveDesktopPrompts && !options.playPrompt}
                    id="lobbyPlayPrompt"
                >
                    <Text text={options.playPrompt || ''} />
                </div>
            </div>
            <div className={styles.playerLabels} id="lobbyPlayerLabels">
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
        <div className={styles.previousResult} id="lobbyPreviousResult">
            <ScoreRow {...props.result} idPrefix="lobbyPrevious" />
        </div>
    );
}

function getPromptClassName(visible: boolean) {
    return getClassName([
        styles.promptSlot,
        visible ? '' : styles.reservedHidden
    ]);
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
                        className={getPlayerLabelClassName(label)}
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

function getPlayerLabelClassName(label: LobbyTextLine) {
    return getClassName([
        styles.playerLabel,
        getPlayerLabelVariantClassName(label.variant),
        label.negative ? 'negative-text' : ''
    ]);
}

function getPlayerLabelVariantClassName(variant: LobbyTextLine['variant']) {
    if (variant === 'player-status') {
        return styles.playerStatus;
    }

    if (variant === 'opponent-placeholder-marker') {
        return styles.opponentPlaceholderMarker;
    }

    return '';
}

function getClassName(classNames: string[]) {
    return classNames.filter(Boolean).join(' ');
}
