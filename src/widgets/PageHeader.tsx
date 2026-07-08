import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { omitObjectKeys } from "../modules/util";
import { gtype, property, register } from "gnim/gobject";
import { IconButton, isLabelButton, LabelButton, DetailedButton, isDetailedButton } from "libvibe";
import { toBoolean } from "gnim-utils";
import { Accessor, createBinding, For, This } from "gnim";
import Pango from "gi://Pango?version=1.0";
import { Image as VibeImage } from "libvibe/utils";
import { Image } from "./Image";
import Adw from "gi://Adw?version=1";


@register({ GTypeName: "VibePageHeader" })
export class PageHeader extends Gtk.Box {
    declare readonly $signals: PageHeader.SignalSignatures;
    declare readonly $readWriteProperties: PageHeader.ReadWriteProperties;

    @property(gtype<string|null>(String))
    title: string|null = null;

    @property(gtype<string|null>(String))
    description: string|null = null;

    @property(gtype<VibeImage|null>(GObject.Object))
    image: VibeImage|null = null;

    @property(Array)
    buttons: Array<IconButton|LabelButton|DetailedButton> = [];


    constructor(props: Partial<GObject.ConstructorProps<PageHeader>>) {
        super(omitObjectKeys(props, [
            "image",
            "title",
            "description",
            "buttons"
        ]));

        this.add_css_class("header");

        const image = createBinding(this, "image");
        const title = createBinding(this, "title");
        const description = createBinding(this, "description");

        if(props.image !== undefined)
            this.image = props.image;

        if(props.title !== undefined)
            this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined && props.buttons.length > 0)
            this.buttons = props.buttons;


        void (
            <This this={this as PageHeader} heightRequest={286}>
                <Adw.Clamp orientation={Gtk.Orientation.VERTICAL} maximumSize={286}>
                    <Image image={image as Accessor<VibeImage>} canShrink keepAspectRatio/>
                </Adw.Clamp>

                <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand={false}>
                    <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.START}>
                        <Gtk.Label xalign={0} label={title(s => s ?? "")} class={"title-1"} 
                          ellipsize={Pango.EllipsizeMode.END} visible={toBoolean(title)}
                          valign={Gtk.Align.START}
                        />
                        <Gtk.Label xalign={0} label={description(s => s ?? "")} class={"title-2 dimmed"}
                          visible={toBoolean(description)} ellipsize={Pango.EllipsizeMode.END}
                          valign={Gtk.Align.START}
                        />
                    </Gtk.Box>
                    <Gtk.Box class={"buttons"} spacing={4} valign={Gtk.Align.END} vexpand={false}>
                        <For each={createBinding(this, "buttons")}>
                            {(button: LabelButton|IconButton|DetailedButton, i) => {
                                return isDetailedButton(button) ?
                                    <Gtk.Button class={`pill${i.peek() === 0 ? " accent" : ""}`} onClicked={() => button.onClicked?.()}>
                                        <Gtk.Box spacing={4}>
                                            <Gtk.Image iconName={button.iconName} />
                                            <Gtk.Label label={button.label} />
                                        </Gtk.Box>
                                    </Gtk.Button>
                                : <Gtk.Button class={isLabelButton(button) ? "pill" : "circular"}
                                    label={(button as LabelButton).label} // returns undefined if the button is not a LabelButton anyways
                                    iconName={(button as IconButton).iconName} // same as the label prop
                                    onClicked={() => button.onClicked?.()}
                                />
                            }}
                        </For>
                    </Gtk.Box>
                </Gtk.Box>
            </This>
        );
    }
}


export namespace PageHeader {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {
        "notify::title"(): void;
        "notify::image"(): void;
        "notify::description"(): void;
        "notify::buttons"(): void;
    }

    export interface ReadWriteProperties extends Gtk.Box.ReadWriteProperties {
        title: string;
        image: VibeImage|null;
        description: string;
        buttons: Array<IconButton|LabelButton|DetailedButton>;
    }
}
