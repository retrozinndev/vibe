import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register } from "gnim/gobject";
import { Section } from "libvibe";
import { Plugin } from "libvibe/plugin";


// only built-in plugins can have a different class name from "VibePlugin"(external)
@register()
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
            url: "https://github.com/retrozinndev/vibe/blob/main/src/plugins/builtin",
            version: "0.0.1",
            implements: {
                recommendations: true
            }
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
                }
            }
        );
    }

    getRecommendations(length?: number, offset?: number): Promise<Array<Section> | null> | Array<Section> | null {
        return [{
                title: "A test section",
                description: "does it work?"
            }, {
                title: "Another section for testing",
                description: "It probably does work!"
            }
        ] satisfies Array<Section>;
    }
}
