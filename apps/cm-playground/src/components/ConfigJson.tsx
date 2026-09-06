// What the settings add up to: the two objects handed to the emulator.
import { useState } from "react";

import type { GeneratedConfig } from "../machine/config";
import { Button, Section } from "./ui";

export const ConfigJson = ({ generated }: { generated: GeneratedConfig }) => {
    const [copied, setCopied] = useState(false);
    // A stored machine brings its own configuration inside the tarball, so
    // there is nothing to show for it but the half that describes the host.
    const loading = generated.config === null;
    const text = JSON.stringify(
        loading
            ? { runtime: generated.runtime }
            : { config: generated.config, runtime: generated.runtime },
        null,
        2,
    );

    return (
        <Section
            title="Configuration"
            hint={
                loading
                    ? "Exactly what load() is called with — the machine's own configuration is inside the snapshot."
                    : "Exactly what create() is called with."
            }
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
