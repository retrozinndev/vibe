import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import GObject from "gi://GObject?version=2.0";
import { Accessor, createBinding, createComputed, createRoot, For } from "gnim";
import { getter, gtype, property, register } from "gnim/gobject";
import {
    DetailedButton,
    IconButton,
    isIconButton,
    isLabelButton,
    LabelButton,
    Vibe,
    Section as VibeSection
} from "libvibe";
import { Album, Artist, Playlist, Song, SongList, VibeObject } from "libvibe/objects";
import { omitObjectKeys } from "../modules/util";
import { createScopedConnection, toBoolean } from "gnim-utils";
import Card from "./Card";
import Media from "../modules/media";
import Gio from "gi://Gio?version=2.0";
import { Image } from "libvibe/utils";
import { AnimatedScroll } from "./AnimatedScroll";


@register({ GTypeName: "VibeSection" })
class Section extends Gtk.Box {
    declare readonly $signals: Section.SignalSignatures;
    declare readonly $readableProperties: Section.ReadableProperties;
    declare readonly $readWriteProperties: Section.ReadWriteProperties;

    #list: Gio.ListStore;
    #grid: Gtk.GridView;

    @getter(Array<Song|SongList|Artist>)
    get content() {
        const arr: Array<Song|SongList|Artist> = [];
        for(let i = 0; i < this.#list.get_n_items(); i++)
            arr.push(this.#list.get_item(i)! as Song|SongList|Artist);

        return arr;
    }

    private set content(arr: Array<Song|SongList|Artist>) {
        this.#list.remove_all();
        for(const item of arr)
            this.#list.append(item);
    }

    @getter(gtype<NonNullable<VibeSection["type"]>>(String))
    get type() {
        return this.#grid.get_max_columns() === 1 ?
            "row"
        : "listrow";
    }
    protected set type(type: NonNullable<VibeSection["type"]>) {
        if(type === "row") {
            this.#grid.set_max_columns(1);
            return;
        }

        this.#grid.set_max_columns(6);
    }

    @property(String)
    title: string;

    @property(gtype<string|null>(String))
    description: string|null = null;

    @property(Array<IconButton|LabelButton>)
    headerButtons: Array<IconButton|LabelButton> = [];

    @property(gtype<IconButton|LabelButton|null>(Object))
    endButton: IconButton|LabelButton|null = null;


    constructor(props: VibeSection & Partial<GObject.ConstructorProps<Section>>) {
        super({
            cssName: "section",
            valign: Gtk.Align.START,
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
        this.#list = Gio.ListStore.new(VibeObject);

        if(props.description !== undefined)
            this.description = props.description;

        if(props.content !== undefined)
            this.content = props.content;

        if(props.endButton !== undefined)
            this.endButton = props.endButton;

        if(props.headerButtons !== undefined)
            this.headerButtons = props.headerButtons;

        this.set_orientation(Gtk.Orientation.VERTICAL);
        
        this.#grid = Gtk.GridView.new(
            Gtk.NoSelection.new(this.#list), 
            new Section.ItemFactory()
        );

        
        if(props.type !== undefined)
            this.type = props.type;

        const id = (this as Section).connect("destroy", () => {
            this.disconnect(id);
            this.#grid.run_dispose();
        });

        this.#grid.remove_css_class("view");
        this.#grid.set_hexpand(true);
        this.#grid.set_vexpand(false);
        this.#grid.set_orientation(Gtk.Orientation.HORIZONTAL);

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


        const scroll = new AnimatedScroll({
            visible: true,
            propagateNaturalWidth: true,
            vscrollbarPolicy: Gtk.PolicyType.NEVER,
            child: this.#grid
        });
        const overlay = new Gtk.Overlay({
            visible: true,
            child: scroll
        });
        this.append(overlay);

        const adjust = scroll.get_hadjustment();
        const leftButton = <Gtk.Button onClicked={() => {
              scroll.scroll(adjust.get_value() - (adjust.get_page_size() / 2));
          }} visible={adjust.get_value() > adjust.get_lower()} 
          halign={Gtk.Align.START}
        /> as Gtk.Button;
        const rightButton = <Gtk.Button onClicked={() => {
              scroll.scroll(adjust.get_value() + (adjust.get_page_size() / 2));
          }} visible={adjust.get_value() < adjust.get_upper()}
          halign={Gtk.Align.END}
        /> as Gtk.Button;

        overlay.add_overlay(leftButton);
        overlay.add_overlay(rightButton);

        const onMoved = () => {
            if(adjust.get_value() >= adjust.get_upper()) {
                rightButton.is_visible() && rightButton.set_visible(false);
                return;
            } else if(adjust.get_value() <= adjust.get_lower()) {
                leftButton.is_visible() && leftButton.set_visible(false);
                return;
            }

            !rightButton.is_visible() && rightButton.set_visible(true);
            !leftButton.is_visible() && leftButton.set_visible(true);
        };

        const valueChanged = adjust.connect("value-changed", () => onMoved());
        const pageSize = adjust.connect("notify::page-size", () => onMoved());

        const destroy = scroll.connect("destroy", () => {
            scroll.disconnect(destroy);
            adjust.disconnect(pageSize);
            adjust.disconnect(valueChanged);
        });
    }
}

namespace Section {
    @register({ GTypeName: "VibeSectionItemFactory" })
    export class ItemFactory extends Gtk.SignalListItemFactory {
        #ids: Array<number>;

        constructor() {
            super();

            this.#ids = [
                (this as ItemFactory).connect("bind", (_, obj) => {
                    const widget = obj as Gtk.ListItem;

                    widget.set_child(this.genCard(widget.get_item()! as never));
                    widget.get_child()!.get_parent()?.set_valign(Gtk.Align.START);
                }),
            ];
        }

        
        private genCard(item: Artist|Album|Song|SongList|Playlist): Gtk.Widget {
            const widget: Card = createRoot(dispose => <Card title={
                item instanceof Artist ?
                    createComputed(() =>
                        createBinding(item, "displayName")() ?? 
                            createBinding(item, "name")() ?? "Unknown Artist"
                    )
                : createBinding(item, "title") as Accessor<string>
              }
              image={item instanceof Song ?
                  createComputed(() => {
                      const albumArt = createBinding(item, "album", "image")()!;
                      const image = createBinding(item, "image")()!;

                      return image ?? albumArt;
                  })
              : createBinding(item, "image") as Accessor<Image<any>>}
              description={
                  item instanceof SongList ?
                      createBinding(item, "description") as Accessor<string>
                  : item instanceof Artist ?
                      createComputed(() => createBinding(item, "name")() ?? "Unknown")
                  : createBinding(item, "artist")(artist => artist.map(a =>
                      a.displayName ?? a.name ?? "Unknown"
                  ).join(", "))
              }
              buttons={item instanceof Song ? [{
                  iconName: "media-playback-start-symbolic",
                  onClicked: () => Media.playObject(item)
              }] : undefined}
              onClicked={() => Vibe.getDefault().addPage({
                  content: item
              })}
              onDestroy={() => dispose()}
              valign={Gtk.Align.START}
              class="card"
              widthRequest={150}
              heightRequest={230}
            /> as Card);

            return widget;
        }

        run_dispose(): void {
            super.run_dispose();
            this.#ids.forEach(id => this.disconnect(id));
        }
    }

    export interface SignalSignatures extends Gtk.Box.SignalSignatures {
        "notify::type"(): void;
        "notify::content"(): void;
        "notify::title"(): void;
        "notify::description"(): void;
        "notify::header-buttons"(): void;
        "notify::end-button"(): void;
    }
    export interface ReadableProperties extends Gtk.Box.ReadableProperties {
        "type": NonNullable<VibeSection["type"]>;
        "content": NonNullable<VibeSection["content"]>;
    }
    export interface ReadWriteProperties extends Gtk.Box.ReadWriteProperties {
        "title": string;
        "description": string|null;
        "header-buttons": Array<LabelButton|IconButton|DetailedButton>;
        "end-button": LabelButton|IconButton|DetailedButton;
    }
}

export default Section;
