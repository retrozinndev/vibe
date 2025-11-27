import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section, Vibe } from "libvibe";
import { PageModal } from "libvibe/interfaces";
import { SongList, Song, Artist } from "libvibe/objects";
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

    #library: Array<Song|SongList|Artist> = [];

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

        try {
            const items = musicDir.enumerate_children(
                "standard::*", 
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            
            for(const item of items) {
                if(!new RegExp(`\\.(${this.supportedFormats.join('|')})`).test(item.get_name()))
                   continue;

                this.#library.push(new Song({
                    image: GdkPixbuf.Pixbuf.new_from_resource("/io/github/retrozinndev/vibe/examples/lagtrain.jpg"),
                    file: `${musicDir.peek_path()!}/${item.get_name()}`,
                    name: item.get_name(),
                    plugin: this
                }));
            }
        } catch(_) {}
    }

    getRecommendations(length?: number, offset?: number): Promise<Array<Section> | null> | Array<Section> | null {
        return [{
            title: "Your songs",
            description: "Songs that have been found in the music directory",
            type: "row",
            headerButtons: [{
                label: "bleh!",
                onClicked: () => {
                    print("haha!");
                }
            }],
            content: this.#library
        } satisfies Section];
    }

    search(search: string): Promise<Array<Song | Artist | SongList | Section> | null> | Array<Song | Artist | SongList | Section> | null {
        Vibe.getDefault().addPage({
            modal: PageModal.ARTIST,
            content: new Artist({
                name: "inabakumori",
                displayName: "稲葉曇",
                description: "Inabakumori’s career started with “Secret Music” on February 22, 2016 and has posted twenty two songs since then. A song that represents Inabakumori – “Lost Umbrella” has created noise internationally since 2021 with the self-insert fan posts on TikTok and has gained international fans that led to being listed on “Global Hits From Japan 2021&2022 – Japanese Music that Crosses Borders -.” Music since then has been played globally, especially in North America amongst the anime fans. Artwork and music video since this song have been created by popular illustrator Nukunukunigirimeshi. The light rhythm and the sound of techno rock that hints transience and the emotional lyrics are visually depicted in black and white in Nukunukunigirimeshi-created music videos. Currently, there are half a million subscribers on YouTube and over a million listeners on Spotify.",
                image: GdkPixbuf.Pixbuf.new_from_resource("/io/github/retrozinndev/vibe/examples/lagtrain.jpg"),
                plugin: this,
                url: "https://open.spotify.com/artist/25b7eSZD64Sm8ReHZ1WDc7",
            }),
            title: "inabakumori",
            buttons: [{
                label: "Follow",
                iconName: "test-pass-symbolic",
                onClicked: () => print("follow this amazing artist!")
            }],
            sections: [{
                title: "Songs",
                description: "Nice songs not from this artist(sike!)",
                content: this.#library
            }]
        });
        return this.#library;
    }

    getLibrary(length?: number, offset?: number): Promise<Array<SongList | Song | Artist> | null> | Array<SongList | Song | Artist> | null {
        return this.#library;
    }
}
