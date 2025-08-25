import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import GObject, { register, getter } from "gnim/gobject";


export const Album = (name: string, flags: GObject.ParamFlags) => 
    GObject.ParamSpec.jsobject(name, null, null, flags) as GObject.ParamSpec<Album>;

export const Song = (name: string, flags: GObject.ParamFlags) =>
    GObject.ParamSpec.jsobject(name, null, null, flags) as GObject.ParamSpec<Song>;
    
export const Artist = (name: string, flags: GObject.ParamFlags) => 
    GObject.ParamSpec.jsobject(name, null, null, flags) as GObject.ParamSpec<Album>;

export type Album = {
    title?: string;
    artists?: Array<Artist> | Artist;
    songs: Array<Song>;
    image?: string | GdkPixbuf.Pixbuf;
};

export type Song = {
    title: string;
    artist?: Array<Artist> | Artist;
    album?: Album;
    image?: string | GdkPixbuf.Pixbuf;
    url?: string;
};

export type Artist = {
    displayName?: string;
    name: string;
    albums?: Array<Album>;
    url?: string;
};

@register({ GTypeName: "Media" })
export default class Media extends GObject.Object {
    private static instance: Media;

    readonly #exampleAlbum: Album = {
        image: GdkPixbuf.Pixbuf.new_from_resource(
            "/io/github/retrozinndev/vibe/examples/rainy_boots.jpg"
        ),
        songs: []
    };

    /** the active song (can be null if there's none) */
    #song: Song|null = {
        title: "Rainy Boots",
        artist: {
            name: "inabakumori",
            url: "https://open.spotify.com/artist/25b7eSZD64Sm8ReHZ1WDc7"
        },
        url: "https://open.spotify.com/track/29z7qKoF5vNyilj2YWZVzh",
        album: this.#exampleAlbum
    };

    
    @getter(Song) 
    /** the active song (can be null if there's none) */
    get song() { return this.#song!; }

    constructor() {
        super();
    }

    public static getDefault(): Media {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }
}
