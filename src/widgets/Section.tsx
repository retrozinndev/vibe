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
    Section as VibeSection
} from "libvibe";
import { Artist, Song, SongList } from "libvibe/objects";
import Media from "../modules/media";
import { omitObjectKeys, toBoolean } from "../modules/util";
import Card from "./Card";
import SmallCard from "./SmallCard";


@register({ GTypeName: "VibeSection" })
export default class Section extends Adw.Bin {
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
        super(omitObjectKeys(props, [
            "content",
            "title",
            "description",
            "type",
            "endButton",
            "headerButtons"
        ]));

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


        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <Gtk.CenterBox orientation={Gtk.Orientation.HORIZONTAL}>
                    <Gtk.Box orientation={Gtk.Orientation.VERTICAL} $type="start">
                        <Gtk.Label class={"title-1"} label={createBinding(this, "title")} 
                          xalign={0} ellipsize={Pango.EllipsizeMode.END}
                        />

                        <Gtk.Label class={"body dimmed"} visible={toBoolean(createBinding(this, "description"))}
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
                </Gtk.CenterBox>
                {
                    this.#type === "listrow" ?
                        <Gtk.FlowBox orientation={Gtk.Orientation.HORIZONTAL} minChildrenPerLine={1}>
                            {this.#content.map(item => {
                                if(item instanceof Song)
                                    return <SmallCard title={item.name ?? "Unnamed"}
                                      image={item.image ?? undefined}
                                      buttons={[{
                                          id: "play-song",
                                          iconName: "media-playback-start-symbolic",
                                          onClicked: () => Media.getDefault().playSong(item, 0)
                                      }]}
                                    />

                                if(item instanceof Artist)
                                    return <SmallCard title={item.name ?? "Unknown Artist"}
                                      image={item.image ?? undefined}
                                      buttons={[{
                                          id: "play-song",
                                          iconName: "media-playback-start-symbolic",
                                          onClicked: () => { /* TODO: redirect to artist page */ }
                                      }]}
                                    />

                                return <SmallCard title={item.title ?? "No Title"} 
                                  // TODO: wait for internet provider's DNS to get back :broken_heart:, 
                                  // so I can add an image to the SongList(I already committed the feature,
                                  // but i can't push it because of the CLARO BR DNS blocking almost everything)
                                  buttons={[{
                                      id: "play-songlist",
                                      iconName: "media-playback-start-symbolic",
                                      onClicked: () => Media.getDefault().playList(item, 0)
                                  }]}
                                />
                            })}
                        </Gtk.FlowBox>
                    : <Gtk.ScrolledWindow vscrollbarPolicy={Gtk.PolicyType.NEVER} 
                      hscrollbarPolicy={Gtk.PolicyType.AUTOMATIC} hexpand>

                        {this.#content.map(item => {
                            if(item instanceof Song)
                                return <Card title={item.name ?? "Unnamed"}
                                  description={item.artist?.map(a => a.name).join(', ') ?? "Unknown Artist"}
                                  image={item.image ?? undefined}
                                  buttons={[{
                                      id: "play-song",
                                      iconName: "media-playback-start-symbolic",
                                      onClicked: () => Media.getDefault().playSong(item, 0)
                                  }]}
                                />

                            if(item instanceof Artist)
                                return <Card title={item.name ?? "Unknown Artist"}
                                  image={item.image ?? undefined}
                                  buttons={[{
                                      id: "play-song",
                                      iconName: "media-playback-start-symbolic",
                                      onClicked: () => { /* TODO: redirect to artist page */ }
                                  }]}
                                />

                            return <Card title={item.title ?? "No Title"} 
                              description={item.description ?? undefined}
                              // TODO: wait for internet provider's DNS to get back :broken_heart:, 
                              // so I can add an image to the SongList(I already committed the feature,
                              // but i can't push it because of the CLARO BR DNS blocking almost everything)
                              buttons={[{
                                  id: "play-songlist",
                                  iconName: "media-playback-start-symbolic",
                                  onClicked: () => Media.getDefault().playList(item, 0)
                              }]}
                            />
                        })}
                    </Gtk.ScrolledWindow>
                }
            </Gtk.Box> as Gtk.Box
        );
    }
}
