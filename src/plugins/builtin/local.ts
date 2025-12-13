import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section } from "libvibe";
import { SongList, Song, Artist, Meta } from "libvibe/objects";
import { Plugin } from "libvibe/plugin";


@register()
export class PluginLocal extends Plugin {
    supportedFormats: Array<string> = [
        "m4a",
        "flac",
        "mkv",
        "ogg",
        "weba",
        "mp3", // add more if needed (this is only for format checking)
    ];

    #library: Array<Song|SongList|Artist> = [];
    #musicDir: Gio.File;

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

        this.#musicDir = Gio.File.new_for_path(`${userMusicDir}/Vibe/Local`);

        if(!this.#musicDir.query_exists(null))
            this.#musicDir.make_directory_with_parents(null);

        try {
            this.addToLibrary(this.#musicDir);
        } catch(_) {}
    }

    /** recursively-add songs to library from a directory */
    private addToLibrary(dir: Gio.File): void {
        try {
            const items = dir.enumerate_children(
                "standard::*", 
                Gio.FileQueryInfoFlags.NONE,
                null
            );
            
            for(const item of items) {
                if(item.get_file_type() === Gio.FileType.DIRECTORY) {
                    this.addToLibrary(Gio.File.new_for_path(`${dir.peek_path()!}/${item.get_name()}`));
                    continue;
                }

                if(!new RegExp(`\\.(${this.supportedFormats.join('|')})`).test(item.get_name()))
                   continue;

                const song = new Song({
                    source: `${dir.peek_path()!}/${item.get_name()}`,
                    plugin: this
                });

                try {
                    const tags = Meta.getMetaTags(song.source as Gio.File);
                    Meta.applyTags(song, tags, this, {
                        applyImageAsynchronously: false
                    });
                } catch(e) {
                    console.log("Local: couldn't apply metadata to song", e);
                }

                this.#library.push(song);
            }
        } catch(e) {
            console.error(e);
        }
    }

    getRecommendations(length?: number, offset?: number) {
        return [
            {
                title: "Your Songs",
                description: "Songs that have been found in the music directory",
                type: "listrow",
                headerButtons: [{
                    label: "bleh!",
                    onClicked: () => {
                        print("haha!");
                    }
                }],
                content: this.#library
            } satisfies Section
        ];
    }

    search(search: string) {
        const matchRegEx = new RegExp(search.split('').join('|'), 'i');

        // TODO better search method
        const results = this.#library.filter(item => {
            if(item instanceof Song) 
                return matchRegEx.test(
                    item.title ?? item.artist.map(a => a.displayName ?? a.name).join(', ') ?? "Untitled"
                );

            return false;
        });

        return null;
    }

    getLibrary(length?: number, offset?: number): Promise<Array<SongList | Song | Artist> | null> | Array<SongList | Song | Artist> | null {
        return this.#library;
    }
}
