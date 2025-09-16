import GObject, { getter, register } from "gnim/gobject";
import { Artist, Song } from "libvibe";
import { Vibe } from "../app";


@register({ GTypeName: "Media" })
export default class Media extends GObject.Object {
    private static instance: Media;

    /** the active song (can be null if there's none) */
    #song: Song|null = new Song({
        name: "Rainy Boots",
        id: Vibe.generateID(),
        file: "",
        artist: [
            new Artist({
                name: "inabakumori",
                url: "https://open.spotify.com/artist/25b7eSZD64Sm8ReHZ1WDc7"
            })
        ],
        url: "https://open.spotify.com/track/29z7qKoF5vNyilj2YWZVzh"
    });

    
    /** the active song (can be null if there's none) */
    @getter(Song.ParamSpec) 
    get song() { return this.#song!; }

    constructor() {
        super();
    }

    public static getDefault(): Media {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }

    /** play a song */
    private playSong(song: Song): void {}

    /** play/resume current song */
    public play(): void {}

    /** pause the current song */
    public pause(): void {}

    /** jump to the next song of the queue */
    public next(): void {}

    /** go back to the previous song of the queue */
    public previous(): void {}
}
