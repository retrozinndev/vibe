import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { DetailedButton, Section, Vibe } from "libvibe";
import { SongList, Song, Artist, Album } from "libvibe/objects";
import { Meta } from "libvibe/utils";
import { Plugin } from "libvibe/plugin";

Gio._promisify(Gio.File.prototype, "enumerate_children_async", "enumerate_children_finish");


@register()
export class PluginLocal extends Plugin {
    supportedFormats: Array<string> = [
        "m4a",
        "flac",
        "aiff",
        "alac",
        "ogg",
        "weba",
        "mp3"
    ];

    #library: Array<Song> = [];
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
                library: false
            }
        });

        this.#musicDir = Gio.File.new_for_path(GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC) ?? "~");

        if(!this.#musicDir.query_exists(null))
            this.#musicDir.make_directory_with_parents(null);

        (this as PluginLocal).connect("page-request", (_, page) => {
            const object = page.content;

            if(object instanceof Artist) {
                // TODO: a better thing for editing sections
                const songs = this.#library.filter(song => song.artist.find(artist => artist.id === object.id));

                page.sections = [
                    {
                        title: "Albums",
                        description: `Produced by ${object.displayName ?? object.name}`,
                        content: Vibe.getDefault().objects[this.id].album.filter(album =>
                            album.artist.find(artist => artist.id === object.id)
                        )
                    },
                    {
                        title: "Songs",
                        description: `Made exclusively by ${object.displayName ?? object.name}`,
                        content: songs.filter(song => song.artist[0].id === object.id)
                    },
                    {
                        title: "Collaborations",
                        description: `Songs where ${object.displayName ?? object.name} was a co-producer`,
                        content: songs.filter(song => song.artist[0].id !== object.id)
                    }
                ]
                return;
            }

            if(object instanceof Album) {
                page.buttons = [{
                    label: "Play all",
                    iconName: "media-playback-start-symbolic",
                    onClicked: () => {
                        Vibe.getDefault().media.playList(object, 0);
                    }
                } satisfies DetailedButton];
                return;
            }
        });
    }

    /** recursively list the children of a directory.
      * it basically works as a `find`
      * @param path the `GFile` for the directory 
      * 
      * @returns children and their children... */
    async recurse(path: Gio.File): Promise<Array<Gio.File>> {
        const files: Array<Gio.File> = [];
        // @ts-ignore
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
        const files = (await this.recurse(dir)).sort((fa, fb) => {
            const a = fa.query_info(Gio.FILE_ATTRIBUTE_TIME_MODIFIED, Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null),
                b = fb.query_info(Gio.FILE_ATTRIBUTE_TIME_MODIFIED, Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            const aTime = a.get_modification_date_time(),
                bTime = b.get_modification_date_time();

            if(!bTime)
                return 0;

            if(!aTime)
                return 1;

            return bTime.difference(aTime) < 0 ? 0 : 1;
        });

        for(const file of files) {
            if(!new RegExp(`\\.(${this.supportedFormats.join('|')})$`).test(file.get_basename()!))
                continue;

            const song = new Song<Gio.File>({
                source: file,
                title: file.get_basename()!,
                plugin: this
            });
            this.#library.push(song);

            const tags = await Meta.getTagsAsync(song.source!.peek_path()!);
            Meta.applyTags(song, tags, this);
        }
    }

    async getRecommendations(_?: number, __?: number) {
        if(!this.#scanned) {
            this.#promise ??= this.addToLibrary(this.#musicDir).finally(() => {
                this.#scanned = true;
                this.#promise = null;
            }).catch((e: Error) => {
                Vibe.getDefault().addDialog({
                    title: "Scan Error",
                    content: `An error occurred while scanning songs in the Music directory:\n${e.message}`
                })
            });
        }

        try {
            if(this.#promise) 
                await this.#promise;
        } catch(e) {
            console.error(e);
            Vibe.getDefault().addDialog({
                title: "Scan Error",
                content: `A scan error occurred:\n${(e as Error).message}`
            });
        }

        return [{
            title: "New songs",
            description: "Songs that have been added to your library recently",
            type: "row",
            content: this.#library.slice(0, 8)
        }] satisfies Array<Section>;
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
        const data = Vibe.getDefault().objects[this.id];
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
        });

        data.artist.forEach(artist => {
            if(this.match(search, artist.displayName ?? artist.name ?? "Unnamed Artist")) 
                results.artists.unshift(artist);
        });

        data.album.forEach(album => {
            if(this.match(search, album.title ?? "Untitled Album"))
                results.albums.unshift(album);
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
