import picocolors from "picocolors";

/**
 * Creates colors for Knit's terminal output.
 *
 * Some interactive terminal hosts advertise a limited TERM value or set
 * NO_COLOR for captured subprocess output even though they render ANSI styles.
 * Color support is therefore based on whether stdout is an interactive TTY,
 * and is disabled when NO_COLOR is set. Redirected output stays plain.
 *
 * @param interactive - Whether ANSI colors should be enabled. Defaults to whether stdout is a TTY.
 * @returns A picocolors instance configured for the current output stream.
 */
export function createCliColors(interactive = process.stdout.isTTY === true) {
    return picocolors.createColors(interactive && !("NO_COLOR" in process.env));
}
