import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { Plugin, Song, Vibe } from "libvibe";


// only built-in plugins can have a different class name from "VibePlugin"(external)
export class PluginLocal extends Plugin {

    supportedFormats: Array<string> = [
        "m4a",
        "flac",
        "ogg",
        "weba",
        "mp3", // add more if needed (this is only for format checking)
    ];

    constructor() {
        super({
            name: "Local",
            description: "Play music from your local files",
            implements: {
                sections: true
            },
            url: "https://github.com/retrozinndev/vibe/blob/main/src/plugins/builtin",
            version: "0.0.1"
        });

        // load songs from default directory (temporary, i'll make a way to configure it later)
        const userMusicDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC) ??
            `${GLib.get_home_dir()}/Music`;

        const vibeMusicDir = Gio.File.new_for_path(`${userMusicDir}/Vibe/Local`);

        if(!vibeMusicDir.query_exists(null))
            vibeMusicDir.make_directory_with_parents(null);

        vibeMusicDir.enumerate_children_async(
            "standard::*", 
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            null,
            (_, res) => {
                const items = vibeMusicDir.enumerate_children_finish(res);

                for(const item of items) {
                    if(!new RegExp(`\\.(${this.supportedFormats.join('|')})`).test(item.get_name()))
                       continue;

                    // add song
                    this.songlist.add(new Song({
                        id: Vibe.getDefault().generateID(),
                        file: `${vibeMusicDir.peek_path()!}/${item.get_name()}`
                    }));
                }
            }
        );
    }
}
