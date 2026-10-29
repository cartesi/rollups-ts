// The small pieces every panel is made of.
import type { ChangeEvent, ReactNode } from "react";

export const Section = ({
    title,
    hint,
    children,
    actions,
}: {
    title: string;
    hint?: string;
    children: ReactNode;
    actions?: ReactNode;
}) => (
    <section className="panel">
        <header className="panel-head">
            <h2>{title}</h2>
            {actions}
        </header>
        {hint === undefined ? null : <p className="hint">{hint}</p>}
        <div className="panel-body">{children}</div>
    </section>
);

export const Field = ({
    label,
    hint,
    children,
    wide,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
    wide?: boolean;
}) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as `children`, so it does sit inside this label
    <label className={wide === true ? "field field-wide" : "field"}>
        <span className="field-label">{label}</span>
        {children}
        {hint === undefined ? null : <span className="field-hint">{hint}</span>}
    </label>
);

export const TextInput = ({
    value,
    onChange,
    placeholder,
    mono,
    disabled,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    disabled?: boolean;
}) => (
    <input
        className={mono === true ? "input mono" : "input"}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
        }
    />
);

export const TextArea = ({
    value,
    onChange,
    placeholder,
    rows = 4,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}) => (
    <textarea
        className="input mono"
        value={value}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
    />
);

export const Toggle = ({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    hint?: string;
}) => (
    <label className="toggle">
        <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
        />
        <span>
            {label}
            {hint === undefined ? null : (
                <span className="field-hint"> — {hint}</span>
            )}
        </span>
    </label>
);

export const Select = <T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string }[];
}) => (
    <select
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
    >
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);

/**
 * One of a handful of things this can be, laid out as cards rather than as a
 * select: these are the choices worth seeing all of before picking one.
 */
export const Choice = <T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string; hint: string }[];
}) => (
    <div className="choice">
        {options.map((option) => (
            <button
                type="button"
                key={option.value}
                className={
                    option.value === value
                        ? "choice-option choice-selected"
                        : "choice-option"
                }
                aria-pressed={option.value === value}
                onClick={() => onChange(option.value)}
            >
                <span className="choice-label">{option.label}</span>
                <span className="field-hint">{option.hint}</span>
            </button>
        ))}
    </div>
);

export const Button = ({
    children,
    onClick,
    kind = "default",
    disabled,
}: {
    children: ReactNode;
    onClick: () => void;
    kind?: "default" | "primary" | "danger" | "ghost";
    disabled?: boolean;
}) => (
    <button
        type="button"
        className={`button button-${kind}`}
        onClick={onClick}
        disabled={disabled}
    >
        {children}
    </button>
);
