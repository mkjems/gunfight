type TransitionOptions<State> = {
    canTransition: (currentState: State, nextState: State) => boolean;
    currentState: State;
    nextState: State;
};

export function resolve<State>(options: TransitionOptions<State>): State {
    if (!options.canTransition(options.currentState, options.nextState)) {
        throw new Error(
            'Illegal round state transition: ' +
                String(options.currentState) +
                ' -> ' +
                String(options.nextState)
        );
    }

    return options.nextState;
}

export const ClientRoundTransition = {
    resolve
};
