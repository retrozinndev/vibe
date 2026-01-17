import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createBinding, For, Node } from "gnim";
import GObject, { getter, gtype, property, register } from "gnim/gobject";
import { IconButton, LabelButton, Section as SectionType, Vibe } from "libvibe";
import { PageType, PageProps, Page as VibePage } from "libvibe/interfaces";
import { Album, Artist, Playlist, Song } from "libvibe/objects";
import Section from "./Section";
import { construct, createSecureBinding } from "gnim-utils";
import SongItem from "./SongItem";
import Tab from "./Tab";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";


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
    buttons: Array<IconButton & LabelButton> = [];

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
            children = <Gtk.Box class="artist-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <Gtk.Image hexpand={false} visible={Boolean((this.#content as Artist).image)} 
                      pixelSize={128}
                      $={(self) => {
                          const img = (this.#content as Artist).image;

                          if(!img)
                              return;

                          if(img instanceof GdkPixbuf.Pixbuf) {
                              self.set_from_pixbuf(img);
                              return;
                          }

                          self.set_from_paintable(img);
                      }}
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

                <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} keepAspectRatio={false}
                      widthRequest={128} hexpand={false} visible={Boolean((this.#content as Song).image ?? 
                          (this.#content as Song).album?.image)
                      } $={(self) => {
                          const img = (this.#content as Artist).image;

                          if(!img)
                              return;

                          if(img instanceof GdkPixbuf.Pixbuf) {
                              self.set_pixbuf(img);
                              return;
                          }
                          
                          self.set_paintable(img);
                      }}
                    />
                    <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL}>
                        <Gtk.Label xalign={0} label={(this.#content as Song).title ??
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

                <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} 
                      hexpand={false} visible={Boolean((this.#content as Album).image)}
                      $={(self) => {
                          const img = (this.#content as Album).image;

                          if(!img)
                              return;

                          if(img instanceof GdkPixbuf.Pixbuf) {
                              self.set_pixbuf(img);
                              return;
                          }

                          self.set_paintable(img);
                      }}
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
        } else if(this.#content instanceof Playlist) {
            children = <Gtk.Box class="playlist-page" orientation={Gtk.Orientation.VERTICAL}
              spacing={16}>

                <Gtk.Box class="header" orientation={Gtk.Orientation.HORIZONTAL} hexpand>
                    <Gtk.Picture canShrink={false} contentFit={Gtk.ContentFit.COVER} 
                      hexpand={false} visible={Boolean((this.#content as Playlist).image)}
                      $={(self) => {
                          const img = (this.#content as Playlist).image;

                          if(!img)
                              return;

                          if(img instanceof GdkPixbuf.Pixbuf) {
                              self.set_pixbuf(img);
                              return;
                          }

                          self.set_paintable(img);
                      }}
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
