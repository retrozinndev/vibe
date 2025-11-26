// TODO: Page widget
//
// This will add a new StackPage to the content of the app's splitview's GtkStack
// at construction-time
// Also, it should have modals, like ARTIST, SONG, ALBUM and PLAYLIST,
// each of them displaying the content in a different way.

import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createBinding, For, Node } from "gnim";
import GObject, { getter, gtype, property, register } from "gnim/gobject";
import { IconButton, LabelButton, Section as SectionType, Vibe } from "libvibe";
import { PageContentType, PageModal, PageProps, Page as VibePage } from "libvibe/interfaces";
import { Album, Artist, Playlist, Song } from "libvibe/objects";
import Section from "./Section";
import { createSecureBinding } from "gnim-utils";
import SongItem from "./SongItem";
import Tab from "./Tab";


@register({ GTypeName: "VibePage" })
export class Page<M extends PageModal = PageModal.CUSTOM> extends Adw.Bin implements VibePage<M> {

    readonly id: any;
    tab: Tab|null = null;

    #modal: M = PageModal.CUSTOM as M;
    #content?: PageContentType<M>;

    @getter(gtype<M>(Number))
    get modal() { return this.#modal; }

    @property(Array)
    sections: Array<SectionType> = [];

    @property(String)
    title: string;

    @getter(gtype<PageContentType<M>|undefined>(GObject.Object))
    get content() { return this.#content; }

    @property(Array<IconButton & LabelButton>)
    buttons: Array<IconButton & LabelButton> = [];

    constructor(props: PageProps<M> & {
        tab?: Tab;
    }) {
        super({
            cssName: "page"
        });

        this.set_hexpand(true);

        if(props.modal !== PageModal.CUSTOM && !this.is_content_of_type(props.modal, props.content))
            throw new Error("Content of the specified type is now allowed in this modal");

        this.id = props.id ?? Vibe.getDefault().generateID();
        this.#modal = props.modal as M;
        this.#content = props.content as PageContentType<M>;

        this.title = props.title;

        if(props.buttons !== undefined && props.buttons.length > 0) 
            this.buttons = props.buttons;

        if(props.tab !== undefined)
            this.tab = props.tab;

        let children: Node = undefined;

        switch(this.#modal) {
            case PageModal.ARTIST:
                children = <Gtk.Box class="artist-page" orientation={Gtk.Orientation.VERTICAL}
                  spacing={16}>

                    <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                        <Gtk.Image hexpand={false} visible={Boolean((this.#content as Artist).image)} 
                          pixelSize={128}
                          $={(self) => self.set_from_pixbuf(
                              (this.#content as Artist).image
                          )}
                        />
                        <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                            <Gtk.Label xalign={0} label={(this.#content as Artist).displayName ??
                                  (this.#content as Artist).name ?? "Unnamed Artist"
                              } class={"title-1"} ellipsize={Pango.EllipsizeMode.END}
                            />
                            <Gtk.Label xalign={0} label={(this.#content as Artist).name}
                              visible={Boolean((this.#content as Artist).displayName ||
                                  (this.#content as Artist).displayName === (this.#content as Artist).name
                              )}
                              ellipsize={Pango.EllipsizeMode.END} class={"heading dimmed"}
                            />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.Box class={"sections"} orientation={Gtk.Orientation.VERTICAL} hexpand
                      spacing={10}>

                        {props.sections && <For each={createBinding(this, "sections")}>
                            {(section: SectionType) => 
                                <Section {...section} hexpand />
                            }
                        </For>}
                    </Gtk.Box>
                </Gtk.Box>;
            break;

            case PageModal.SONG:
                children = <Gtk.Box class="song-page" orientation={Gtk.Orientation.VERTICAL}
                  spacing={16}>

                    <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                        <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} 
                          hexpand={false} visible={Boolean((this.#content as Song).image ?? 
                              (this.#content as Song).album?.image)
                          } $={(self) => self.set_pixbuf(
                              (this.#content as Song).image ??
                                  (this.#content as Song).album?.image
                          )}
                        />
                        <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL}>
                            <Gtk.Label xalign={0} label={(this.#content as Song).name ??
                                  "Untitled Song"
                              } class={"title-1"} ellipsize={Pango.EllipsizeMode.END}
                            />
                            <Gtk.Label xalign={0} visible={Boolean((this.#content as Song).artist && 
                                  (this.#content as Song).artist!.length > 0
                              )} ellipsize={Pango.EllipsizeMode.END} class={"heading dimmed"}
                              label={(this.#content as Song).artist?.map(artist =>
                                  artist.displayName ?? artist.name
                              ).join(", ")}
                            />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.Box class={"sections"} orientation={Gtk.Orientation.VERTICAL} hexpand
                      spacing={10}>

                        {props.sections && <For each={createBinding(this, "sections")}>
                            {(section: SectionType) => 
                                <Section {...section} hexpand />
                            }
                        </For>}
                    </Gtk.Box>
                </Gtk.Box>;
            break;

            case PageModal.ALBUM:
                children = <Gtk.Box class="album-page" orientation={Gtk.Orientation.VERTICAL}
                  spacing={16}>

                    <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                        <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} 
                          hexpand={false} visible={Boolean((this.#content as Album).image)}
                          $={(self) => self.set_pixbuf(
                              (this.#content as Album).image
                          )}
                        />
                        <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL}>
                            <Gtk.Label xalign={0} label={(this.#content as Album).title ??
                                  "Untitled Album"
                              } class={"title-1"} ellipsize={Pango.EllipsizeMode.END}
                            />
                            <Gtk.Label xalign={0} visible={Boolean((this.#content as Album).artist && 
                                  (this.#content as Album).artist!.length > 0
                              )} ellipsize={Pango.EllipsizeMode.END} class={"heading dimmed"}
                              label={(this.#content as Album).artist?.map(artist =>
                                  artist.displayName ?? artist.name
                              ).join(", ")}
                            />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.ListBox class={"songs"} hexpand>
                        {(this.#content as Album).songs.map(song =>
                            <SongItem song={song} />
                        )}
                    </Gtk.ListBox>
                </Gtk.Box>;
            break;

            case PageModal.PLAYLIST:
                children = <Gtk.Box class="playlist-page" orientation={Gtk.Orientation.VERTICAL}
                  spacing={16}>

                    <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                        <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} 
                          hexpand={false} visible={Boolean((this.#content as Playlist).image)}
                          $={(self) => self.set_pixbuf(
                              (this.#content as Playlist).image
                          )}
                        />
                        <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL}>
                            <Gtk.Label xalign={0} label={(this.#content as Playlist).title ??
                                  "Untitled Playlist"
                              } class={"title-1"} ellipsize={Pango.EllipsizeMode.END}
                            />
                            <Gtk.Label xalign={0} visible={(this.#content as Playlist).description !== undefined}
                              ellipsize={Pango.EllipsizeMode.END} class={"heading dimmed"}
                              label={(this.#content as Playlist).description !== undefined ?
                                  createSecureBinding((this.#content as Playlist), "description", "")
                              : undefined}
                            />
                        </Gtk.Box>
                    </Gtk.Box>
                    <Gtk.ListBox class={"songs"} hexpand>
                        {(this.#content as Album).songs.map(song =>
                            <SongItem song={song} />
                        )}
                    </Gtk.ListBox>
                </Gtk.Box>;
            break;
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

    private is_content_of_type<T extends PageModal>(modal: T, content: any): content is PageContentType<T> {
        return (modal === PageModal.SONG && content instanceof Song)
            || (modal === PageModal.ALBUM && content instanceof Album)
            || (modal === PageModal.ARTIST && content instanceof Artist)
            || (modal === PageModal.PLAYLIST && content instanceof Playlist)
            || false;
    }

    private modal_to_string<M extends PageModal>(modal: M): string {
        switch(modal) {
            case PageModal.SONG:
                return "song";

            case PageModal.ALBUM:
                return "album";

            case PageModal.ARTIST:
                return "artist";

            case PageModal.PLAYLIST:
                return "playlist";
        }

        return "custom";
    }
}
