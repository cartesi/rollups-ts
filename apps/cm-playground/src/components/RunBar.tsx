// Boot, stop, and what the machine has done so far.
import type { MachineState } from "../machine/useMachine";
import { Button } from "./ui";

const number = new Intl.NumberFormat("en-US");

export const RunBar = ({
    state,
    problems,
    onBoot,
    onStop,
    onClear,
}: {
    state: MachineState;
    problems: string[];
    onBoot: () => void;
    onStop: () => void;
    onClear: () => void;
}) => {
    const busy = state.phase === "starting" || state.phase === "running";
    const stats = state.stats;

    return (
        <div className="runbar">
            <div className="runbar-controls">
                <Button
                    kind="primary"
                    onClick={onBoot}
                    disabled={busy || problems.length > 0}
                >
                    {state.phase === "done" || state.phase === "error"
                        ? "boot again"
                        : "boot"}
                </Button>
                <Button kind="danger" onClick={onStop} disabled={!busy}>
                    stop
                </Button>
                <Button kind="ghost" onClick={onClear} disabled={busy}>
                    clear
                </Button>
            </div>

            <div className="runbar-stats">
                <span className={`badge badge-${state.phase}`}>
                    {state.status === "" ? state.phase : state.status}
                </span>
                {stats === null ? null : (
                    <>
                        <span>
                            <strong>
                                {number.format(Number(stats.mcycle))}
                            </strong>{" "}
                            cycles
                        </span>
                        <span>
                            <strong>{stats.mips.toFixed(1)}</strong> MIPS
                        </span>
                        <span>
                            <strong>{stats.seconds.toFixed(1)}</strong> s
                        </span>
                    </>
                )}
                {state.outcome === null ? null : (
                    <>
                        {state.outcome.exitCode === null ? null : (
                            <span>
                                exit <strong>{state.outcome.exitCode}</strong>
                            </span>
                        )}
                        <span
                            className="mono hash"
                            title={state.outcome.rootHash}
                        >
                            {state.outcome.rootHash.slice(0, 16)}…
                        </span>
                    </>
                )}
                {state.emulator === null ? null : (
                    <span className="field-hint">
                        emulator {state.emulator}
                    </span>
                )}
            </div>

            {problems.length === 0 ? null : (
                <p className="error">{problems.join(" · ")}</p>
            )}
            {state.error === null ? null : (
                <p className="error">{state.error}</p>
            )}
        </div>
    );
};
