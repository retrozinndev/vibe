import Gtk from "gi://Gtk?version=4.0";
import { gtype, property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { DetailedButton, LabelButton } from "libvibe";
import { Accessor, createBinding, For } from "gnim";
import { MenuItem } from "./MenuItem";


@register({ GTypeName: "VibePopoverMenu" })
export class Menu extends Gtk.Popover {

    /** an array containing button definitions that are used internally to generate widgets */
    @property(Array)
    buttons: Array<Menu.Button> = [];

    /** the menu type */
    @property(gtype<Menu.Mode>(Number))
    mode: Menu.Mode = Menu.Mode.NORMAL;

    /** whether the menu should close(popdown) after an option has been selected/triggered */
    @property(Boolean)
    closeOnSelect: boolean = true;

    /** if the menu should wait for double click to activate a button.
      * this can mess things up depending on the current `mode` */
    @property(Boolean)
    activateOnDoubleClick: boolean = false;


    constructor(props: Partial<Menu.ConstructorProps>) {
        super(omitObjectKeys(props, ["buttons"]));

        this.add_css_class("menu"); // for it to have the adwaita menu style
        
        if(props.buttons !== undefined && props.buttons.length > 0)
            this.buttons = props.buttons;

        if(props.mode !== undefined)
            this.mode = props.mode;

        if(props.closeOnSelect !== undefined)
            this.closeOnSelect = props.closeOnSelect;


        // TODO: all the frickin' stuff lol
        this.set_child(
            <Gtk.ListBox selectionMode={createBinding(this, "mode")(mode =>
                  mode === Menu.Mode.SELECT_MANY ?
                      Gtk.SelectionMode.MULTIPLE
                  : Gtk.SelectionMode.NONE
              )} activateOnSingleClick={createBinding(this, "activateOnDoubleClick")(v => !v)}
              onRowSelected={(listbox, row) => {
                  row?.activate(); // activate row on selection
                  if(this.mode !== Menu.Mode.NORMAL && row instanceof MenuItem) {
                      const selectedRow = listbox.get_selected_row() as MenuItem|null;

                      if(selectedRow && this.mode === Menu.Mode.SELECT && selectedRow !== row)
                          selectedRow.selected = false;

                      row.selected = true;
                  }

                  this.closeOnSelect &&
                      this.popdown();
              }}>

                <For each={createBinding(this, "buttons")}>
                    {(b: Menu.Button) => 
                        <MenuItem label={b.label} iconName={(b as DetailedButton)?.iconName}
                          selected={b.selected}
                          onActivate={() => b.onClicked?.()}
                        />
                    }
                </For>
            </Gtk.ListBox> as Gtk.ListBox
        );
    }
}

export namespace Menu {
    export enum Mode {
        NORMAL = 0,
        SELECT = 1,
        SELECT_MANY = 2
    }

    export type Button = (LabelButton|DetailedButton) & {
        selected?: boolean|Accessor<boolean>;
    };

    export interface ConstructorProps extends Gtk.Popover.ConstructorProps {
        buttons: Array<Menu.Button>;
        mode: Menu.Mode;
        closeOnSelect: boolean;
    }
}
