import Gtk from "gi://Gtk?version=4.0";
import Page from "../widgets/Page";
import { Artist, Playlist, Song, Vibe } from "libvibe";
import { register } from "gnim/gobject";
import Card from "../widgets/Card";
import Media from "../modules/media";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Adw from "gi://Adw?version=1";

const inabakumori = new Artist({
    name: "inabakumori",
    url: "https://youtube.com/c/inabakumori"
});

const rainyBoots = new Song({
    name: "Rainy Boots",
    artist: [inabakumori],
    id: Vibe.getDefault().generateID()
});

const lagtrain = new Song({
    name: "Lagtrain",
    artist: [inabakumori],
    id: Vibe.getDefault().generateID()
});

const playlist = new Playlist({
    title: "inabakumori!",
    description: "The best of inabakumori on my opinion! (all of them are great tbh :D)",
    songs: [rainyBoots, lagtrain]
});

@register({ GTypeName: "VibePageLibrary" })
export default class Library extends Page {
    constructor() {
        super({
            tabName: "Library",
            title: "Your Library",
            iconName: "user-bookmarks-symbolic"
        });

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL} hexpand={false} halign={Gtk.Align.START}>
                <Adw.Clamp orientation={Gtk.Orientation.HORIZONTAL}
                  maximumSize={148}>
                    <Card title={playlist.title ?? "Untitled Playlist"}
                      description={playlist.description ?? undefined}
                      buttonAlign={Gtk.Align.END}
                      halign={Gtk.Align.START} valign={Gtk.Align.START}
                      image={GdkPixbuf.Pixbuf.new_from_resource(
                          "/io/github/retrozinndev/vibe/examples/lagtrain.jpg"
                      )} buttons={[
                          {
                              id: "play",
                              iconName: "media-playback-start-symbolic",
                              onClicked: () => Media.getDefault().playList(playlist, 0)
                          }
                      ]}
                    />
                </Adw.Clamp>
            </Gtk.Box> as Gtk.Box
        );
    }
}
