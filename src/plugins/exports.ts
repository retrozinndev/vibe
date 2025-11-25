let exported: boolean = false;

const libvibe = {
    vibe: (await import("libvibe")),
    objects: (await import("libvibe/objects")),
    plugin: (await import("libvibe/plugin"))
};


export function exportToGlobal(): void {
    if(exported) {
        console.warn("libvibe was already exported before, skipped global export");
        return;
    }

    // add libvibe to globalThis, so plugins can access the same instances as the app
    Object.assign(globalThis, { libvibe });
    exported = true;
}


