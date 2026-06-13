import { Config } from '../../platform/config.js';

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

type HitMessageProps = {
    hitMessage?: HitMessage | null;
};

export function GameHudComponent(options: GameHudProps) {
    return (
        <>
            <div id="scoreRow">
                <ScoreSide
                    id="scoreLeft"
                    name={options.leftName}
                    score={options.leftScore}
                    side="left"
                />
                <div id="roundTimer">{toText(options.timerLabel)}</div>
                <ScoreSide
                    id="scoreRight"
                    name={options.rightName}
                    score={options.rightScore}
                    side="right"
                />
            </div>
            <AmmoRow displays={options.ammoDisplays || []} />
            <div id="roundMessage" className="large-text">
                {toText(options.roundMessage)}
            </div>
            <HitMessageView hitMessage={options.hitMessage} />
        </>
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
    const score = <span className="scoreValue">{toText(props.score, 0)}</span>;
    const label = name ? <span className="scoreName">{name}</span> : null;

    return (
        <div className={'scoreSide is-' + props.side} id={props.id}>
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

type AmmoRowProps = {
    displays: AmmoHudDisplay[];
};

function AmmoRow(props: AmmoRowProps) {
    const left = props.displays.find((display) => display.side === 'left');
    const right = props.displays.find((display) => display.side === 'right');

    return (
        <div aria-hidden="true" hidden={!left && !right} id="ammoRow">
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
            className={'ammoDisplay is-' + props.side}
            hidden={!props.display}
            id={props.id}
        >
            {createAmmoRounds(props.display?.count || 0)}
        </div>
    );
}

function createAmmoRounds(count: number) {
    const activeCount = Math.max(0, Math.floor(count));

    return Array.from({ length: Config.round.ammo }, function (_, index) {
        const visible = index < activeCount;

        return (
            <img
                alt=""
                className={'ammoRound' + (visible ? '' : ' is-empty')}
                key={index}
                src="images/bullet.png"
            />
        );
    });
}

function HitMessageView(props: HitMessageProps) {
    const hitMessage = props.hitMessage;

    if (!hitMessage) {
        return <div id="hitMessage" hidden></div>;
    }

    return (
        <div
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

function toText(value: unknown, fallback: unknown = '') {
    if (typeof value === 'undefined' || value === null) {
        return String(fallback);
    }

    return String(value);
}
