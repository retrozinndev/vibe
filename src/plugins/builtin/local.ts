import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section, Vibe } from "libvibe";
import { SongList, Song, Artist, Meta } from "libvibe/objects";
import { Plugin } from "libvibe/plugin";


@register()
export class PluginLocal extends Plugin {
    supportedFormats: Array<string> = [
        "m4a",
        "flac",
        "ogg",
        "weba",
        "mp3"
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

                if(song.title === null)
                    song.title = item.get_name();

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

    
    // TODO better search method
    match(search: string, item: Song|SongList|string): boolean {
        search = search.replace(/[\\^$.*?()[\]{}|]/g, "\\$&");

        return new RegExp(`${search.split('').map(c => 
            `${c}`).join('')}`,
        "gi").test(typeof item !== "string" ?
            item instanceof Song ?
                `${item.title} ${item.artist.map(a => a.displayName ?? a.name).join(';')}`
            : item.title ?? "Untitled List"
        : item);
    }

    async search(search: string) {
        const results: Record<string, Array<Song|SongList|Artist>> = {
            songs: [],
            artists: [],
            albums: [],
            playlists: []
        };

        this.#library.forEach(item => {
            if(item instanceof Song && this.match(search, item)) {
                results.songs.unshift(item);
                return;
            }

            if(item instanceof SongList && this.match(search, item)) {
                results.albums.unshift(item);
                return;
            }
        });

        Vibe.getDefault().artists.filter(d => d.plugin === this).forEach(data => {
            if(this.match(search, data.artist.displayName ?? data.artist.name ?? "Unnamed Artist")) 
                results.artists.unshift(data.artist);
        });

        return Object.keys(results).filter(key => 
            results[key as keyof typeof results].length > 0
        ).map(key => {
            const data = results[key as keyof typeof results];

            return {
                title: key.replace(/^./, (c) => c.toUpperCase()),
                content: data,
                type: "row"
            } satisfies Section;
        });
    }

    getLibrary(length?: number, offset?: number): Promise<Array<SongList | Song | Artist> | null> | Array<SongList | Song | Artist> | null {
        return this.#library;
    }
}
