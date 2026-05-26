import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { Accessor, createBinding, createComputed, For } from "gnim";
import { getter, gtype, property, register } from "gnim/gobject";
import {
    IconButton,
    isIconButton,
    isLabelButton,
    LabelButton,
    Vibe,
    Section as VibeSection
} from "libvibe";
import { Album, Artist, Playlist, Song, SongList } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import { toBoolean } from "gnim-utils";
import Card from "./Card";
import Adw from "gi://Adw?version=1";
import Media from "../modules/media";


@register({ GTypeName: "VibeSection" })
export default class Section extends Gtk.Box {
    #content: Array<Song|SongList|Artist> = [];
    #type: NonNullable<VibeSection["type"]> = "row";

    @getter(Array<Song|SongList|Artist>)
    get content() { return this.#content; }

    @getter(gtype<NonNullable<VibeSection["type"]>>(String))
    get type() { return this.#type; }

    @property(String)
    title: string;

    @property(gtype<string|null>(String))
    description: string|null = null;

    @property(Array<IconButton|LabelButton>)
    headerButtons: Array<IconButton|LabelButton> = [];

    @property(gtype<IconButton|LabelButton|null>(Object))
    endButton: IconButton|LabelButton|null = null;


    constructor(props: VibeSection & Partial<Gtk.Box.ConstructorProps>) {
        super({
            cssName: "section",
            ...omitObjectKeys(props, [
                "content",
                "title",
                "description",
                "type",
                "endButton",
                "headerButtons"
            ])
        });

        this.title = props.title;
        if(props.description !== undefined)
            this.description = props.description;

        if(props.type !== undefined)
            this.#type = props.type;

        if(props.content !== undefined)
            this.#content = props.content;

        if(props.endButton !== undefined)
            this.endButton = props.endButton;

        if(props.headerButtons !== undefined)
            this.headerButtons = props.headerButtons;

        this.set_orientation(Gtk.Orientation.VERTICAL);
        this.append(
            <Gtk.CenterBox orientation={Gtk.Orientation.HORIZONTAL}>
                <Gtk.Box orientation={Gtk.Orientation.VERTICAL} class={"start"} $type="start">
                    <Gtk.Label class={"title title-1"} label={createBinding(this, "title")} 
                      xalign={0} ellipsize={Pango.EllipsizeMode.END}
                    />

                    <Gtk.Label class={"description body dimmed"} visible={toBoolean(createBinding(this, "description"))}
                      label={createBinding(this, "description").as(s => s ?? "")}
                      xalign={0}
                    />
                </Gtk.Box>

                <Gtk.Box class={"linked"} visible={toBoolean(createBinding(this, "headerButtons"))}
                  $type="end">

                    <For each={createBinding(this, "headerButtons")}>
                        {(button: IconButton|LabelButton) => 
                            <Gtk.Button label={isLabelButton(button) && button.label !== undefined ? 
                                  button.label : undefined
                              } onClicked={() => button.onClicked?.()}
                              iconName={isIconButton(button) && button.iconName !== undefined ?
                                  button.iconName : undefined
                              }
                            />
                        }
                    </For>
                </Gtk.Box>
            </Gtk.CenterBox> as Gtk.CenterBox
        );

        this.append(
            <Gtk.ScrolledWindow hscrollbarPolicy={Gtk.PolicyType.AUTOMATIC} vscrollbarPolicy={Gtk.PolicyType.NEVER}
              propagateNaturalWidth propagateNaturalHeight hexpand>
              
                <Adw.Clamp maximumSize={1} halign={Gtk.Align.START}>
                    <Gtk.Grid orientation={Gtk.Orientation.HORIZONTAL} rowSpacing={6} 
                      columnSpacing={6} baselineRow={0} hexpand={false} vexpand={false}>

                        {this.genCards(this.#content)}
                    </Gtk.Grid>
                </Adw.Clamp>
            </Gtk.ScrolledWindow> as Gtk.ScrolledWindow
        );
    }
    
    private genCards(items: Array<Artist|Album|Song|Playlist|SongList>): Array<Gtk.Widget> {
        return items.map(item => {
            const widget: Card = <Card title={
                item instanceof Artist ?
                    createComputed(() =>
                        createBinding(item, "displayName")() ?? 
                            createBinding(item, "name")() ?? "Unknown Artist"
                    )
                : createBinding(item, "title") as Accessor<string>
              }
              description={
                  item instanceof SongList ?
                      createBinding(item, "description") as Accessor<string>
                  : item instanceof Artist ?
                      createComputed(() => createBinding(item, "name")() ?? "Unknown")
                  : createBinding(item, "artist")(artist => artist.map(a =>
                      a.displayName ?? a.name ?? "Unknown"
                  ).join(", "))
              }
              buttons={[{
                  iconName: "media-playback-start-symbolic",
                  onClicked: () => Media.playObject(item)
              }]}
              onClicked={() => Vibe.getDefault().addPage({
                  content: item
              })}
            /> as Card;

            widget?.add_css_class("card");
            widget.set_size_request(150, -1);
            return widget;
        });
    }
}
