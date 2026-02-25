import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section, Vibe } from "libvibe";
import { SongList, Song, Artist } from "libvibe/objects";
import { Meta } from "libvibe/utils";
import { Plugin } from "libvibe/plugin";

Gio._promisify(Gio.File.prototype, "enumerate_children_async", "enumerate_children_finish");


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
    #scanned: boolean = false;
    #promise: Promise<unknown>|null = null;

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
    }

    /** recursively list the children of a directory.
      * it basically works as a `find`
      * @param path the `GFile` for the directory 
      * 
      * @returns children and their children... */
    async recurse(path: Gio.File): Promise<Array<Gio.File>> {
        const files: Array<Gio.File> = [];
        for(const child of (await path.enumerate_children_async(
            "standard::*", null, GLib.PRIORITY_DEFAULT, null
        ))) {
            const obj = Gio.File.new_for_path(`${path.peek_path()}/${child.get_display_name()}`);
            if(child.get_file_type() === Gio.FileType.DIRECTORY) {
                const children = await this.recurse(obj);
                files.push(...children);
            } else {
                files.push(obj);
            }
        }

        return files;
    }

    /** recursively-add songs to library from a directory */
    private async addToLibrary(dir: Gio.File): Promise<void> {
        for(const file of (await this.recurse(dir))) {
            if(!new RegExp(`\\.(${this.supportedFormats.join('|')})`).test(file.get_basename()!))
                continue;

            const song = new Song({
                source: file,
                title: file.get_basename()!,
                plugin: this
            });
            this.#library.push(song);

            const tags = await Meta.getMetaTagsAsync(song.source!.peek_path()!);
            Meta.applyTags(song, tags, this);
        }
    }

    async getRecommendations(length?: number, offset?: number) {
        if(!this.#scanned) {
            this.#promise ??= this.addToLibrary(this.#musicDir).finally(() => {
                this.#scanned = true;
                this.#promise = null;
            });

            try {
                if(Boolean(this.#promise))
                    await this.#promise;
            } catch(_) {}
        }

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
