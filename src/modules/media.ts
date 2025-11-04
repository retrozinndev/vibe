import GObject, { getter, gtype, property, register } from "gnim/gobject";
import { Media as VibeMedia, LoopMode, ShuffleMode } from "libvibe/interfaces";
import { Song, SongList } from "libvibe/objects";


/** play and control media from plugins
* @todo */
@register({ GTypeName: "VibeMedia" })
export default class Media extends GObject.Object implements VibeMedia {
    private static instance: VibeMedia;

    #queue: SongList|null = null;
    #song: Song|null = new Song({
        name: "Nothing is Playing"
    });
    
    /** the active song, can be null */
    @getter(gtype<Song|null>(Song)) 
    get song() { return this.#song; }

    @getter(gtype<SongList|null>(SongList))
    get queue() { return this.#queue; }

    @property(gtype<LoopMode>(Number))
    loop: LoopMode = LoopMode.NONE;

    @property(gtype<ShuffleMode>(Number))
    shuffle: ShuffleMode = ShuffleMode.NONE;

    constructor() {
        super();
    }

    public static getDefault(): VibeMedia {
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
