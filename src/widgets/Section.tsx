import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createBinding, For } from "gnim";
import { getter, gtype, property, register } from "gnim/gobject";
import {
    IconButton,
    isIconButton,
    isLabelButton,
    LabelButton,
    Vibe,
    Section as VibeSection
} from "libvibe";
import { Artist, Song, SongList } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import { toBoolean } from "gnim-utils";
import Card from "./Card";


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
            <Gtk.ScrolledWindow propagateNaturalWidth hscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
              vscrollbarPolicy={Gtk.PolicyType.NEVER}>
                <Gtk.FlowBox orientation={Gtk.Orientation.HORIZONTAL} rowSpacing={10} homogeneous 
                  selectionMode={Gtk.SelectionMode.NONE} 
                  $={self => {
                      this.#content.map(item => {
                          if(item instanceof Song)
                              return Card.new_for_song(item, undefined, () => {
                                  Vibe.getDefault().addPage({
                                      content: item,
                                      title: item.title ?? "Untitled Song",
                                      buttons: item.artist.map(artist => ({
                                          label: `Go to ${artist.displayName ?? artist.name}`,
                                          iconName: "person-symbolic",
                                          onClicked: () => Vibe.getDefault().addPage({
                                              content: artist,
                                              title: artist.displayName ?? artist.name
                                          })
                                      }))
                                  })
                              });

                          if(item instanceof Artist)
                              return Card.new_for_artist(item, undefined, () => Vibe.getDefault().addPage({
                                  content: item,
                                  title: item.displayName ?? item.name
                              }));

                          return Card.new_for_songlist(item);
                    }).forEach(card => {
                        card.add_css_class("card");

                        self.insert(
                            <Adw.Clamp orientation={Gtk.Orientation.HORIZONTAL} maximumSize={106}>
                                {card}
                            </Adw.Clamp> as Adw.Clamp,
                        -1);

                        (self.get_last_child() as Gtk.FlowBoxChild).set_hexpand(false);
                    });
                  }}
                />
            </Gtk.ScrolledWindow> as Gtk.ScrolledWindow
        );
    }
}
