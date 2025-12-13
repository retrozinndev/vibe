import Gtk from "gi://Gtk?version=4.0";
import { property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { createBinding, For } from "gnim";
import { toBoolean } from "gnim-utils";
import { isLabelButton, LabelButton } from "libvibe";



/** secondary menu when clicking with the secondary mouse button in 
  * a song, artist or album */
@register({ GTypeName: "VibeSecondaryMenu" })
export class SecondaryMenu extends Gtk.Popover {

    @property(Array<Gtk.Button>)
    buttons: Array<LabelButton|Gtk.Separator> = [];

    constructor(props: {
        buttons?: Array<Gtk.Button>;
    } & Partial<Gtk.Popover.ConstructorProps>) {
        super(omitObjectKeys(props, ["buttons"]));

        if(toBoolean(props.buttons))
            this.buttons = props.buttons!;

        this.add_css_class("menu");
        this.set_child(
            <Gtk.ListBox>
                <For each={createBinding(this, "buttons")}>
                    {(widget: LabelButton|Gtk.Separator) => 
                        isLabelButton(widget) ?
                            <Gtk.Button label={widget.label} onClicked={() => widget.onClicked?.()} />
                        : widget
                    }
                </For>
            </Gtk.ListBox> as Gtk.ListBox
        );
    }
}
