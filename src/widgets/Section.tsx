import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { Accessor, createBinding, For } from "gnim";
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
import Media from "../modules/media";
import { omitObjectKeys } from "../modules/util";
import Card from "./Card";
import SmallCard from "./SmallCard";
import { toBoolean } from "gnim-utils";


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
            this.#type === "listrow" ?
                <Gtk.FlowBox orientation={Gtk.Orientation.HORIZONTAL} minChildrenPerLine={2} selectionMode={Gtk.SelectionMode.NONE}
                  hexpand>

                    {this.#content.map(item => {
                        if(item instanceof Song)
                            return <Adw.Clamp maximumSize={364}>
                                <SmallCard title={item.title ?? "Unnamed"} class={"card"}
                                  image={createBinding(item, "image") as NonNullable<Accessor<never>>}
                                  buttons={[{
                                      id: "play-song",
                                      iconName: "media-playback-start-symbolic",
                                      onClicked: () => Media.getDefault().playSong(item, 0)
                                  }]}
                                />
                            </Adw.Clamp>

                        if(item instanceof Artist)
                            return <SmallCard title={item.name ?? "Unknown Artist"} class={"card"}
                              image={createBinding(item, "image") as NonNullable<Accessor<never>>}
                              buttons={[{
                                  id: "play-song",
                                  iconName: "media-playback-start-symbolic",
                                  onClicked: () => {
                                      Vibe.getDefault().addPage({
                                          content: item,
                                          title: item.displayName ?? item.name ?? "Unnamed Artist"
                                      });
                                  }
                              }]}
                            />

                        return <SmallCard title={item.title ?? "No Title"} class={"card"}
                          image={createBinding(item, "image") as NonNullable<Accessor<never>>}
                          buttons={[{
                              id: "play-songlist",
                              iconName: "media-playback-start-symbolic",
                              onClicked: () => Media.getDefault().playList(item, 0)
                          }]}
                        />
                    })}
                </Gtk.FlowBox> as Gtk.FlowBox
            : <Gtk.ScrolledWindow propagateNaturalWidth hscrollbarPolicy={Gtk.PolicyType.AUTOMATIC}
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
