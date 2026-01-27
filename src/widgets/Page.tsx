import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createComputed, For, Node } from "gnim";
import GObject, { getter, gtype, property, register } from "gnim/gobject";
import { IconButton, LabelButton, DetailedButton, Section as SectionType, Vibe } from "libvibe";
import { PageType, PageProps, Page as VibePage } from "libvibe/interfaces";
import { Album, Artist, Playlist, Song } from "libvibe/objects";
import Section from "./Section";
import { construct } from "gnim-utils";
import SongItem from "./SongItem";
import Tab from "./Tab";
import { PageHeader } from "./PageHeader";


@register({ GTypeName: "VibePage" })
export class Page<T extends PageType = Gtk.Widget> extends Adw.Bin implements VibePage<T> {

    readonly id: any;
    tab: Tab|null = null;

    #content: T;

    @property(Array)
    sections: Array<SectionType> = [];

    @property(String)
    title: string = "New page";

    @getter(gtype<T>(GObject.Object))
    get content() { return this.#content; }

    @property(Array<IconButton & LabelButton>)
    buttons: Array<IconButton|LabelButton|DetailedButton> = [];

    constructor(props: PageProps<T> & {
        tab?: Tab;
    }) {
        super({
            cssName: "page"
        });

        this.set_hexpand(true);

        this.id = props.id ?? Vibe.getDefault().generateID();
        this.#content = props.content as T;

        construct(this, {
            title: props.title,
            // @ts-ignore
            buttons: props.buttons,
            // @ts-ignore
            sections: props.sections
        });
            

        if(props.tab !== undefined)
            this.tab = props.tab;

        let children: Node = undefined;

        if(this.#content instanceof Gtk.Widget) {
            children = this.#content;
        } else if(this.#content instanceof Artist) {
            const name = createBinding(this.#content, "name");
            const description = name(name => name ?? "Unknown Artist");
            const title = createComputed(() => [
                createBinding(this.#content as Artist, "displayName")(),
                name()
            ])(([display, name]) => display ?? name ?? "Unknown Artist");

            children = <Gtk.Box class="artist-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={title} image={this.#content.image ?? undefined}
                  description={description} buttons={createBinding(this, "buttons")}
                />
                <Gtk.Box class={"sections"} orientation={Gtk.Orientation.VERTICAL} hexpand
                  spacing={10}>

                    {<For each={createBinding(this, "sections")}>
                        {(section: SectionType) => 
                            <Section {...section} hexpand />
                        }
                    </For>}
                </Gtk.Box>
            </Gtk.Box>;
        } else if(this.#content instanceof Song) {
            children = <Gtk.Box class="song-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Song")}
                  image={this.#content.image ?? undefined} description={
                      createBinding(this.#content, "artist")(artists => artists.map(artist =>
                          artist.displayName ?? artist.name
                      ).join(", ") || "Unknown Artist")
                  } buttons={createBinding(this, "buttons")}
                />
                <Gtk.Box class={"sections"} orientation={Gtk.Orientation.VERTICAL} hexpand
                  spacing={10}>

                    {<For each={createBinding(this, "sections")}>
                        {(section: SectionType) => 
                            <Section {...section} hexpand />
                        }
                    </For>}
                </Gtk.Box>
            </Gtk.Box>;
        } else if(this.#content instanceof Album) {
            children = <Gtk.Box class="album-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Album")} 
                  image={this.#content.image ?? undefined} description={
                      createBinding(this.#content, "artist")(artists => artists.map(artist =>
                          artist.displayName ?? artist.name
                      ).join(', ') || "Unknown Artist")
                  } buttons={createBinding(this, "buttons")}
                />
                <Gtk.ListBox class={"songs"} hexpand>
                    {this.#content.songs.map(song =>
                        <SongItem song={song} />
                    )}
                </Gtk.ListBox>
            </Gtk.Box>;
        } else if(this.#content instanceof Playlist) {
            children = <Gtk.Box class="playlist-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Album")} 
                  image={this.#content.image ?? undefined} buttons={createBinding(this, "buttons")}
                />
                <Gtk.ListBox class={"songs"} hexpand>
                    {this.#content.songs.map(song =>
                        <SongItem song={song} />
                    )}
                </Gtk.ListBox>
            </Gtk.Box>;
        }
        
        this.set_child(
            <Gtk.ScrolledWindow hscrollbarPolicy={Gtk.PolicyType.NEVER} 
              vscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}>

                <Gtk.Box class={"content"}>
                    {children}
                </Gtk.Box>
            </Gtk.ScrolledWindow> as Gtk.ScrolledWindow
        );
    }

    get_content_widget(): Gtk.Box {
        return ((this.get_child() as Gtk.ScrolledWindow).get_child() as Gtk.Viewport).get_child() as Gtk.Box;
    }


    protected content_to_string<T extends PageType>(content: T): string {
        if(content instanceof Song)
            return "song";

        if(content instanceof Album)
            return "album";

        if(content instanceof Artist)
            return "artist";

        if(content instanceof Playlist)
            return "playlist";

        return "custom";
    }
}
