import { render as renderComponent } from 'preact';
import { arePropsEqual } from './componentRenderProps.js';

type TouchGameplayControlsComponentScreenElements = {
    root?: HTMLElement | null;
};

type TouchGameplayControlsComponentScreenRenderOptions = {
    visible?: boolean;
};

/**
 * Owns the static joystick/aim/fire markup only. Pointer handling, knob
 * transforms, and aim handle positions are imperative element updates owned
 * by the touch input module; see the per-frame rendering rule in
 * documentation/UI-ownership.md.
 */
export class TouchGameplayControlsComponentScreen {
    elements: TouchGameplayControlsComponentScreenElements;
    lastRenderedOptions?: TouchGameplayControlsComponentScreenRenderOptions;

    constructor(elements: TouchGameplayControlsComponentScreenElements = {}) {
        this.elements = elements;
    }

    render(options: TouchGameplayControlsComponentScreenRenderOptions = {}) {
        if (!this.elements.root) {
            return false;
        }

        if (
            this.lastRenderedOptions &&
            arePropsEqual(this.lastRenderedOptions, options)
        ) {
            return false;
        }

        renderComponent(
            <TouchGameplayControls {...options} />,
            this.elements.root
        );
        this.lastRenderedOptions = options;

        return true;
    }
}

function TouchGameplayControls(
    options: TouchGameplayControlsComponentScreenRenderOptions
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
