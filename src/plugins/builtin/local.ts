import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section } from "libvibe";
import { SongList, Song, Artist, Album } from "libvibe/objects";
import { Plugin } from "libvibe/plugin";


@register()
export class PluginLocal extends Plugin {
    supportedFormats: Array<string> = [
        "m4a",
        "flac",
        "ogg",
        "weba",
        "mp3", // add more if needed (this is only for format checking)
    ];

    // this library thing is just for testing purposes
    #inabakumori: Artist = new Artist({
        name: "inabakumori",
        displayName: "Inabakumori",
        image: GdkPixbuf.Pixbuf.new_from_resource("/io/github/retrozinndev/vibe/examples/rainy_boots.jpg"),
        description: "A super cool vocaloid artist!",
        plugin: this
    });

    #library: Array<Song|SongList|Artist> = [
        new Album({
            title: "Anticyclone",
            artist: [this.#inabakumori],
            image: this.#inabakumori.image!,
            songs: [
                new Song({
                    name: "Rainy Boots",
                    artist: [this.#inabakumori],
                    image: this.#inabakumori.image!,
                    plugin: this
                }),
                new Song({
                    name: "Lagtrain",
                    artist: [this.#inabakumori],
                    image: GdkPixbuf.Pixbuf.new_from_resource("/io/github/retrozinndev/vibe/examples/lagtrain.jpg"),
                    plugin: this
                })
            ]
        }),
    ];

    constructor() {
        super({
            name: "Local",
            description: "Play music from your local files",
            url: "https://github.com/retrozinndev/vibe/blob/main/src/plugins/builtin",
            version: "0.0.1",
            implements: {
                recommendations: true,
                search: true,
                library: true
            }
        });

        // load songs from default directory (temporary, i'll make a way to configure it later)
        const userMusicDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC) ??
            `${GLib.get_home_dir()}/Music`;

        const musicDir = Gio.File.new_for_path(`${userMusicDir}/Vibe/Local`);

        if(!musicDir.query_exists(null))
            musicDir.make_directory_with_parents(null);

        musicDir.enumerate_children_async(
            "standard::*", 
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            null,
            (_, res) => {
                const items = musicDir.enumerate_children_finish(res);

                for(const item of items) {
                    if(!new RegExp(`\\.(${this.supportedFormats.join('|')})`).test(item.get_name()))
                       continue;

                    // add song
                }
            }
        );
    }

    getRecommendations(length?: number, offset?: number): Promise<Array<Section> | null> | Array<Section> | null {
        return [{
                title: "A test section",
                description: "does it work?",
                content: [
                    this.#inabakumori,
                    ...this.#library
                ]
            }, {
                title: "Another section for testing",
                description: "It probably does work!",
                content: (this.#library[0] as Album).songs
            }
        ] satisfies Array<Section>;
    }

    search(search: string): Promise<Array<Song | Artist | SongList | Section> | null> | Array<Song | Artist | SongList | Section> | null {
        return [this.#inabakumori];
    }

    getLibrary(length?: number, offset?: number): Promise<Array<SongList | Song | Artist> | null> | Array<SongList | Song | Artist> | null {
        return this.#library;
    }
}
