import Gtk from "gi://Gtk?version=4.0";
import { gtype, property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { createBinding } from "gnim";


@register({ GTypeName: "VibeMenuItem" })
export class MenuItem extends Gtk.ListBoxRow {
    @property(Boolean)
    selected: boolean = false;

    @property(String)
    label: string = "Row Item";

    @property(gtype<string|null>(String))
    iconName: string|null = null;


    constructor(props: Partial<PluginSelectorListItem.ConstructorProps>) {
        super(omitObjectKeys(props, [
            "selected",
            "label",
            "iconName"
        ]));

        if(props.selected !== undefined)
            this.selected = props.selected;

        if(props.label !== undefined)
            this.label = props.label;

        if(props.iconName !== undefined)
            this.iconName = props.iconName;

        this.set_child(
            <Gtk.Box hexpand spacing={6}>
                <Gtk.Image iconName={createBinding(this, "iconName")(s => s ?? "image-missing")} 
                  visible={createBinding(this, "iconName")(v => v !== null)}
                />
                <Gtk.Label label={createBinding(this, "label")} xalign={0} />
                <Gtk.Image iconName={"object-select-symbolic"}
                  visible={createBinding(this, "selected")}
                />
            </Gtk.Box> as Gtk.Box
        );
    }
}

export namespace PluginSelectorListItem {
    export interface ConstructorProps extends Gtk.ListBoxRow.ConstructorProps {
        selected: boolean;
        label: string;
        iconName: string|null;
    }
}
