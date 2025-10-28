import * as Libvibe from "libvibe";


declare global {
    const libvibe: typeof Libvibe;

    const VIBE_VERSION: string;
    const GRESOURCES_FILE: string;
    const DEVEL: boolean;
};
