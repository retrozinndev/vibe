import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createComputed, For, Node } from "gnim";
import { setter, getter, gtype, property, register, signal } from "gnim/gobject";
import { IconButton, LabelButton, DetailedButton, Section as SectionType, Vibe } from "libvibe";
import { Page as VibePage } from "libvibe/interfaces";
import { Album, Artist, Playlist, Song } from "libvibe/objects";
import Section from "./Section";
import SongItem from "./SongItem";
import GObject from "gi://GObject?version=2.0";
import { PageHeader } from "./PageHeader";
import { owns } from "../modules/util";
import { Image } from "libvibe/utils";
import Adw from "gi://Adw?version=1";


@register({ GTypeName: "VibePage" })
export class Page<T extends VibePage.Type = Gtk.Widget> extends Gtk.Stack implements VibePage<T> {
    declare readonly $signals: VibePage.SignalSignatures;
    declare readonly $readableProperties: VibePage.ReadableProperties;
    declare readonly $constructOnlyProperties: VibePage.ConstructOnlyProperties;
    declare readonly $readWriteProperties: VibePage.ReadWriteProperties&{
        content: VibePage.ReadWriteProperties["content"]|null;
    };

    readonly id: any;

    #content: T|null;

    @property(String)
    title: string = "New page";

    /** if the page is static, this will be the icon for the tab button */
    @property(gtype<string|null>(String))
    iconName: string|null = null;

    @property(Array)
    sections: Array<SectionType> = [];

    @getter(Boolean)
    get loading() { return this.get_visible_child_name() === "state-loading"; }
    @setter(Boolean)
    set loading(state: boolean) {
        if(this.loading === state)
            return;

        if(state) {
            this.add_named(
                Adw.Spinner.new(),
                "state-loading"
            );
            this.set_visible_child_name("state-loading");
            this.notify("loading");
            return;
        }

        this.set_visible_child_name("content");
        this.notify("loading");

        this.remove(this.get_child_by_name("state-loading")!);
    }

    /** if the page is static, this will be the name for the tab button */
    @property(String)
    tabName: string;

    @getter(GObject.Object)
    get content() { return this.#content!; }

    @property(Array)
    buttons: Array<IconButton|LabelButton|DetailedButton> = [];

    @signal()
    protected refresh() {}

    constructor(props: VibePage.ConstructorProps<T> & {
        tabName?: string;
        iconName?: string;
    }) {
        super({
            cssName: "page"
        });

        this.set_hexpand(true);

        this.id = props.id ?? Vibe.getDefault().generateID();
        this.#content = props.content as T|null;

        if(props.title !== undefined)
            this.title = props.title;

        this.tabName = props.tabName ?? this.title;

        if(owns<Array<IconButton|LabelButton|DetailedButton>>(props, "buttons") && props.buttons !== undefined)
            this.buttons = props.buttons;

        if(owns<Array<SectionType>>(props, "sections") && props.sections !== undefined)
            this.sections = props.sections;
            
        if(props.iconName !== undefined)
            this.iconName = props.iconName;

        if(props.tabName !== undefined)
            this.tabName = props.tabName;

        let widget: Node = undefined;

        if(this.#content instanceof Gtk.Widget) {
            widget = this.#content;
        } else if(this.#content instanceof Artist) {
            const name = createBinding(this.#content, "name");
            const description = name(name => name ?? "Unknown Artist");
            const title = createComputed(() => [
                createBinding(this.#content as Artist, "displayName")(),
                name()
            ])(([display, name]) => display ?? name ?? "Unknown Artist");

            widget = <Gtk.Box class="artist-page" orientation={Gtk.Orientation.VERTICAL}
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
            widget = <Gtk.Box class="song-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Song")}
                  image={this.#content.image ?? this.#content.album?.image ?? undefined} description={
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
            widget = <Gtk.Box class="album-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Album")} 
                  image={this.#content.image ?? undefined} description={
                      createBinding(this.#content, "artist")(artists => artists.map(artist =>
                          artist.displayName ?? artist.name
                      ).join(', ') || "Unknown Artist")
                  } buttons={createBinding(this, "buttons")}
                  class={"header"}
                />
                <Gtk.ListBox class={"songs"} hexpand vexpand={false}>
                    {this.#content.toArray().map(song =>
                        <SongItem song={song} heightRequest={32} />
                    )}
                </Gtk.ListBox>
            </Gtk.Box>;
        } else if(this.#content instanceof Playlist) {
            widget = <Gtk.Box class="playlist-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <PageHeader title={createBinding(this.#content, "title").as(s => s ?? "Untitled Album")} 
                  image={createBinding(this.#content, "image") as Accessor<Image>} 
                  buttons={createBinding(this, "buttons")}
                />
                <Gtk.ListBox class={"songs"} hexpand>
                    {this.#content.toArray().map(song =>
                        <SongItem song={song} />
                    )}
                </Gtk.ListBox>
            </Gtk.Box>;
        }
        
        this.setContent(widget);
    }

    getContent(): Gtk.Widget|null {
        return this.get_child_by_name("content");
    }

    setContent(widget: Gtk.Widget): void {
        const content = this.getContent();

        if(content)
            this.remove(content);

        const page = this.add_named(
            widget,
            "content"
        );

        page.get_child()!.add_css_class("content");
    }


    protected content_to_string<T extends VibePage.Type>(content: T): string {
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
