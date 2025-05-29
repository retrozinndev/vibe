import GObject from "gi://GObject?version=2.0";

export type Album = {
    artists?: Array<string> | string;
};

export type MediaType = {
    title: string;
    artist?: Array<string> | string;
    albumImage?: string | URL;
    album?: Album;
    url?: string | URL;
};

export const Media = GObject.registerClass({
    GTypeName: "Media",
    Properties: {
        "playing": GObject.ParamSpec.boolean(
            "playing",
            "Is playing",
            "A boolean value that represents if there's a controllable media available (playing or paused)",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false
        )
    }
}, class _Media extends GObject.Object {
    constructor() {
        super();
    }

    _init(...args: any[]): void {
        super._init(...args);
    }

    public connect(signal: "media-updated" | string, callback: (...args: any[]) => void): number {
        return super.connect(signal, callback);
    }
});
