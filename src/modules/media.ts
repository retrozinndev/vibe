import GObject, { getter, register, gtype } from "gnim/gobject";
import { Song } from "libvibe";
import { Player } from "./player";


/** get media information (currently-playing media)
* @todo */
@register({ GTypeName: "Media" })
export default class Media extends GObject.Object {
    private static instance: Media;

    #player: Player;
    #song: Song|null = new Song({
        file: "",
        name: "Nothing is Playing",
        id: 464648
    });
    
    /** the active song, can be null */
    @getter(gtype<Song|null>(Song)) 
    get song() { return this.#song; }


    constructor() {
        super();

        const player = new Player();
        this.#player = player;
    }

    public static getDefault(): Media {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }

    /** play a song */
    private playSong(song: Song): void {
        console.log(`Play song: ${song.file}`);
    }

    /** play/resume current song */
    public play(): void {}

    /** pause the current song */
    public pause(): void {}

    /** jump to the next song of the queue */
    public next(): void {}

    /** go back to the previous song of the queue */
    public previous(): void {}
}
