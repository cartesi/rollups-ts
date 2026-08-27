// What the settings add up to: the two objects handed to the emulator.
import { useState } from "react";

import type { GeneratedConfig } from "../machine/config";
import { Button, Section } from "./ui";

export const ConfigJson = ({ generated }: { generated: GeneratedConfig }) => {
    const [copied, setCopied] = useState(false);
    const text = JSON.stringify(
        { config: generated.config, runtime: generated.runtime },
        null,
        2,
    );

    return (
        <Section
            title="Configuration"
            hint="Exactly what create() is called with."
            actions={
                <Button
                    kind="ghost"
                    onClick={() => {
                        void navigator.clipboard?.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    }}
                >
                    {copied ? "copied" : "copy"}
                </Button>
            }
        >
            <pre className="json mono">{text}</pre>
        </Section>
    );
};
