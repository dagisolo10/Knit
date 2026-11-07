import { watch, type FSWatcher } from "fs";
import path from "path";

const DEBOUNCE_MS = 100;

/**
 * Filesystem locations watched during development.
 *
 * Directories are watched recursively. Files are watched through their parent
 * directory without recursion, which keeps entry-point watches narrow and
 * still detects editors that save by replacing the file.
 */
export interface WatchTargets {
    /** Directories whose contents should trigger a restart. */
    directories: readonly string[];
    /** Individual files whose changes should trigger a restart. */
    files?: readonly string[];
}

/**
 * Handle for stopping an active set of file watchers.
 */
export interface WatchHandle {
    /** Stops all watchers and clears any pending debounce timer. */
    close(): void;
}

/**
 * Watches application files for changes.
 *
 * Directory targets are watched recursively and file targets are watched
 * through their parent directory. All events share a 100 ms debounce. Callback
 * runs are serialized, and events received while a callback is running queue at
 * most one follow-up run. Callback and watcher errors are logged without
 * stopping the remaining watchers.
 *
 * @param targets - Directories and files to watch.
 * @param onChange - Callback invoked after file changes are debounced.
 * @returns A handle that stops the watchers when closed.
 */
export function watchPaths(targets: WatchTargets, onChange: () => Promise<void> | void): WatchHandle {
    const watchers: FSWatcher[] = [];
    const directories = normalizeDirectories(targets.directories);

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let pending = false;
    let closed = false;

    const run = async () => {
        if (closed) return;

        if (running) {
            pending = true;
            return;
        }

        running = true;

        do {
            pending = false;

            try {
                await onChange();
            } catch (error) {
                console.error("[KNIT] Failed to handle file change:", error);
            }
        } while (pending && !closed);

        running = false;
    };

    const queue = () => {
        if (closed) return;

        if (debounceTimer !== undefined) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = undefined;
            void run();
        }, DEBOUNCE_MS);
    };

    const addWatcher = (watchPath: string, recursive: boolean, filter?: (filename: string | null) => boolean) => {
        const watcher = watch(watchPath, { recursive }, (_event, filename) => {
            if (filter && !filter(filename)) return;

            queue();
        });

        watcher.on("error", (error) => {
            console.error(`[KNIT] File watcher error for ${watchPath}:`, error);
        });

        watchers.push(watcher);
    };

    for (const directory of directories) {
        addWatcher(directory, true);
    }

    const filesByDirectory = new Map<string, Set<string>>();

    for (const file of new Set(targets.files ?? [])) {
        const directory = path.dirname(file);
        const filenames = filesByDirectory.get(directory) ?? new Set<string>();

        filenames.add(path.basename(file));
        filesByDirectory.set(directory, filenames);
    }

    for (const [directory, filenames] of filesByDirectory) {
        if (directories.some((watchedDirectory) => isSameOrAncestor(watchedDirectory, directory))) {
            continue;
        }

        addWatcher(directory, false, (filename) => filename === null || filenames.has(filename));
    }

    return {
        close() {
            if (closed) return;

            closed = true;

            if (debounceTimer !== undefined) {
                clearTimeout(debounceTimer);
                debounceTimer = undefined;
            }

            for (const watcher of watchers) {
                watcher.close();
            }

            watchers.length = 0;
        },
    };
}

function normalizeDirectories(directories: readonly string[]): string[] {
    const resolved = Array.from(new Set(directories.map((directory) => path.resolve(directory))));

    return resolved.filter((candidate) => !resolved.some((other) => other !== candidate && isSameOrAncestor(other, candidate)));
}

function isSameOrAncestor(parent: string, child: string): boolean {
    const relative = path.relative(parent, child);

    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
