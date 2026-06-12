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
            <div aria-label="Move" hidden={!options.visible} id="touchJoystick">
                <div id="touchJoystickKnob"></div>
            </div>
            <div hidden={!options.visible} id="touchActionControls">
                <div aria-label="Aim" id="touchAimSlider">
                    <div id="touchAimTrack"></div>
                    <div id="touchAimHandle"></div>
                </div>
                <button id="touchShootButton" type="button">
                    FIRE
                </button>
            </div>
        </>
    );
}
