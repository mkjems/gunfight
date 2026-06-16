import styles from './touchGameplayControlsComponentScreen.module.css';

export type TouchGameplayControlsProps = {
    visible?: boolean;
};

/**
 * Owns the static joystick/aim/fire markup only. Pointer handling, knob
 * transforms, and aim handle positions are imperative element updates owned
 * by the touch input module; see the per-frame rendering rule in
 * documentation/UI-ownership.md.
 */
export function TouchGameplayControls(
    options: TouchGameplayControlsProps = {}
) {
    return (
        <>
            <div
                aria-label="Move"
                className={styles.joystick}
                hidden={!options.visible}
                id="touchJoystick"
            >
                <div
                    className={styles.joystickKnob}
                    id="touchJoystickKnob"
                ></div>
            </div>
            <div
                className={styles.actionControls}
                hidden={!options.visible}
                id="touchActionControls"
            >
                <div
                    aria-label="Aim"
                    className={styles.aimSlider}
                    id="touchAimSlider"
                >
                    <div className={styles.aimTrack} id="touchAimTrack"></div>
                    <div className={styles.aimHandle} id="touchAimHandle"></div>
                </div>
                <button
                    className={styles.shootButton}
                    id="touchShootButton"
                    type="button"
                >
                    FIRE
                </button>
            </div>
        </>
    );
}
