import Gst from "gi://Gst?version=1.0";
import GObject, { getter, gtype, register } from "gnim/gobject";
import {
    Media as VibeMedia,
    MediaSignalSignatures,
    SongList,
    Song,
    Vibe,
    Queue
} from "libvibe";


/** play and control media from plugins
* @todo */
@register({ GTypeName: "VibeMedia" })
export default class Media extends GObject.Object implements VibeMedia {
    declare $signals: MediaSignalSignatures;
    private static instance: Media;

    #gstVersion: string;
    #queue: Queue|null = null;
    #song: Song|null = new Song({
        file: "",
        name: "Nothing is Playing",
        id: Vibe.getDefault().generateID()
    });
    
    /** the active song, can be null */
    @getter(gtype<Song|null>(Song)) 
    get song() { return this.#song; }

    @getter(gtype<Queue|null>(Queue))
    get queue() { return this.#queue; }

    constructor() {
        super();

        this.#gstVersion = Gst.version_string();

    }

    public static getDefault(): Media {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }

    public playSong(song: Song, pos: number): void {
    }

    public playList(list: SongList, posNum: number): void {
        
    }

    public resume(): void {}
    public pause(): void {}
    public next(): void {}
    public previous(): void {}
}
