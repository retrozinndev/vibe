import Gtk from "gi://Gtk?version=4.0";
import { omitObjectKeys } from "../modules/util";
import GObject, { gtype, property, register } from "gnim/gobject";
import { IconButton, isLabelButton, LabelButton, DetailedButton, isDetailedButton } from "libvibe";
import { toBoolean } from "gnim-utils";
import { Accessor, createBinding, For } from "gnim";
import Pango from "gi://Pango?version=1.0";
import { Image as VibeImage } from "libvibe/utils";
import { Image } from "./Image";
import Adw from "gi://Adw?version=1";


@register({ GTypeName: "VibePageHeader" })
export class PageHeader extends Gtk.Box {

    @property(gtype<string|null>(String))
    title: string|null = null;

    @property(gtype<string|null>(String))
    description: string|null = null;

    @property(gtype<VibeImage|null>(GObject.Object))
    image: VibeImage|null = null;

    @property(Array)
    buttons: Array<IconButton|LabelButton|DetailedButton> = [];


    constructor(props: Partial<PageHeader.ConstructorProps>) {
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
        const buttons = createBinding(this, "buttons");

        if(props.image !== undefined)
            this.image = props.image;

        if(props.title !== undefined)
            this.title = props.title;

        if(props.description !== undefined)
            this.description = props.description;

        if(props.buttons !== undefined && props.buttons.length > 0)
            this.buttons = props.buttons;


        this.prepend(
            <Adw.Clamp orientation={Gtk.Orientation.VERTICAL} maximumSize={286}
              vexpand={false} hexpand={false}>

                <Image image={image as Accessor<VibeImage>} canShrink
                  keepAspectRatio vexpand hexpand={false}
                />
            </Adw.Clamp> as Adw.Clamp
        );

        this.append(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand={false}>
                <Gtk.Box class="data" orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.START}
                  vexpand>

                    <Gtk.Label xalign={0} label={title.as(s => s ?? "")} class={"title-1"} 
                      ellipsize={Pango.EllipsizeMode.END} visible={toBoolean(title)}
                      valign={Gtk.Align.START}
                    />
                    <Gtk.Label xalign={0} label={description.as(s => s ?? "")} class={"heading dimmed"}
                      visible={toBoolean(description)} ellipsize={Pango.EllipsizeMode.END}
                      valign={Gtk.Align.START}
                    />
                </Gtk.Box>
                <Gtk.Box class={"buttons"} visible={toBoolean(buttons)} spacing={4} valign={Gtk.Align.END}
                  vexpand={false}>

                    <For each={buttons}>
                        {(button: LabelButton|IconButton|DetailedButton) =>
                            isDetailedButton(button) ?
                                <Gtk.Button class={"pill"} onClicked={() => button.onClicked?.()}>
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
                        }
                    </For>
                </Gtk.Box>
            </Gtk.Box> as Gtk.Box
        );
    }
}


export namespace PageHeader {
    export interface SignalSignatures extends Gtk.Box.SignalSignatures {}
    export interface ConstructorProps extends Gtk.Box.ConstructorProps {
        title: string;
        image: VibeImage|null;
        description: string;
        buttons: Array<IconButton|LabelButton|(IconButton&LabelButton)>;
    }
}
