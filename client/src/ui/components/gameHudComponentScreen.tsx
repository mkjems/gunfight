import { Config } from '../../platform/config.js';
import styles from './gameHudComponentScreen.module.css';

export type HitMessage = {
    text: string;
    x: number;
    y: number;
};

export type AmmoHudDisplay = {
    count: number;
    side: 'left' | 'right';
};

export type GameHudProps = {
    ammoDisplays?: AmmoHudDisplay[];
    hitMessage?: HitMessage | null;
    leftName?: string;
    leftScore?: number;
    rightName?: string;
    rightScore?: number;
    roundMessage?: string;
    timerLabel?: number | string | null;
};

export type ScoreRowProps = Pick<
    GameHudProps,
    'leftName' | 'leftScore' | 'rightName' | 'rightScore' | 'timerLabel'
> & {
    idPrefix?: string;
};

type HitMessageProps = {
    hitMessage?: HitMessage | null;
};

export function GameHudComponent(options: GameHudProps) {
    return (
        <>
            <ScoreRow {...options} />
            <AmmoRow displays={options.ammoDisplays || []} />
            <div className={styles.roundMessage} id="roundMessage">
                {toText(options.roundMessage)}
            </div>
            <HitMessageView hitMessage={options.hitMessage} />
        </>
    );
}

export function ScoreRow(options: ScoreRowProps) {
    return (
        <div
            className={styles.scoreRow}
            id={getScoreRowId(options, 'scoreRow')}
        >
            <ScoreSide
                id={getScoreRowId(options, 'scoreLeft')}
                name={options.leftName}
                score={options.leftScore}
                side="left"
            />
            <div
                className={styles.roundTimer}
                id={getScoreRowId(options, 'roundTimer')}
            >
                {toText(options.timerLabel)}
            </div>
            <ScoreSide
                id={getScoreRowId(options, 'scoreRight')}
                name={options.rightName}
                score={options.rightScore}
                side="right"
            />
        </div>
    );
}

type ScoreSideProps = {
    id: string;
    name?: string;
    score?: number;
    side: 'left' | 'right';
};

function ScoreSide(props: ScoreSideProps) {
    const name = toText(props.name).trim();
    const score = (
        <span className={styles.scoreValue}>{toText(props.score, 0)}</span>
    );
    const label = name ? (
        <span className={styles.scoreName}>{name}</span>
    ) : null;

    return (
        <div className={getScoreSideClassName(props.side)} id={props.id}>
            {props.side === 'left' ? (
                <>
                    {score}
                    {label}
                </>
            ) : (
                <>
                    {label}
                    {score}
                </>
            )}
        </div>
    );
}

function getScoreSideClassName(side: ScoreSideProps['side']) {
    return getClassName([
        styles.scoreSide,
        side === 'left' ? styles.leftSide : styles.rightSide
    ]);
}

function getScoreRowId(options: ScoreRowProps, id: string) {
    if (!options.idPrefix) {
        return id;
    }

    return options.idPrefix + id.charAt(0).toUpperCase() + id.slice(1);
}

type AmmoRowProps = {
    displays: AmmoHudDisplay[];
};

function AmmoRow(props: AmmoRowProps) {
    const left = props.displays.find((display) => display.side === 'left');
    const right = props.displays.find((display) => display.side === 'right');

    return (
        <div
            aria-hidden="true"
            className={styles.ammoRow}
            hidden={!left && !right}
            id="ammoRow"
        >
            <AmmoDisplay display={left} id="ammoLeft" side="left" />
            <AmmoDisplay display={right} id="ammoRight" side="right" />
        </div>
    );
}

type AmmoDisplayProps = {
    display?: AmmoHudDisplay;
    id: string;
    side: 'left' | 'right';
};

function AmmoDisplay(props: AmmoDisplayProps) {
    return (
        <div
            className={getAmmoDisplayClassName(props.side)}
            hidden={!props.display}
            id={props.id}
        >
            {createAmmoRounds(props.display?.count || 0)}
        </div>
    );
}

function getAmmoDisplayClassName(side: AmmoDisplayProps['side']) {
    return getClassName([
        styles.ammoDisplay,
        side === 'left' ? styles.leftAmmo : styles.rightAmmo
    ]);
}

function createAmmoRounds(count: number) {
    const activeCount = Math.max(0, Math.floor(count));

    return Array.from({ length: Config.round.ammo }, function (_, index) {
        const visible = index < activeCount;

        return (
            <img
                alt=""
                className={getAmmoRoundClassName(visible)}
                key={index}
                src="images/bullet.png"
            />
        );
    });
}

function getAmmoRoundClassName(visible: boolean) {
    return getClassName([
        styles.ammoRound,
        visible ? '' : styles.emptyAmmoRound
    ]);
}

function HitMessageView(props: HitMessageProps) {
    const hitMessage = props.hitMessage;

    if (!hitMessage) {
        return <div className={styles.hitMessage} id="hitMessage" hidden></div>;
    }

    return (
        <div
            className={styles.hitMessage}
            id="hitMessage"
            style={{
                left: (hitMessage.x / Config.canvas.width) * 100 + '%',
                top: (hitMessage.y / Config.canvas.height) * 100 + '%'
            }}
        >
            {hitMessage.text}
        </div>
    );
}

function getClassName(classNames: string[]) {
    return classNames.filter(Boolean).join(' ');
}

function toText(value: unknown, fallback: unknown = '') {
    if (typeof value === 'undefined' || value === null) {
        return String(fallback);
    }

    return String(value);
}
