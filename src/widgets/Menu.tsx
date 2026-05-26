import Gtk from "gi://Gtk?version=4.0";
import GObject, { getter, gtype, property, register, signal } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { DetailedButton, LabelButton } from "libvibe";
import { Menu as VibeMenu } from "libvibe/interfaces";
import { Accessor, createBinding, createConnection, For } from "gnim";
import { MenuItem } from "./MenuItem";
import Gdk from "gi://Gdk?version=4.0";


@register({ GTypeName: "VibePopoverMenu" })
export class Menu extends Gtk.Popover implements VibeMenu {
    declare $signals: Menu.SignalSignatures;
    #buttons: Array<Menu.Button> = [];

    @signal(Object)
    added(_: Menu.Button) {}

    @signal(Object)
    removed(_: Menu.Button) {}

    @getter(Number)
    get length() { return this.#buttons.length; }

    /** the menu type */
    @property(gtype<Menu.Mode>(Number))
    mode: Menu.Mode = Menu.Mode.NORMAL;

    /** whether the menu should close(popdown) after an option has been selected/triggered */
    @property(Boolean)
    closeOnSelect: boolean = true;


    constructor(props: Partial<Menu.ConstructorProps>) {
        super({
            autohide: false,
            ...omitObjectKeys(props, [
                "buttons",
                "mode",
                "closeOnSelect"
            ])
        });

        this.add_css_class("menu"); // for it to have the adwaita menu style
        
        if(props.buttons !== undefined && props.buttons.length > 0)
            props.buttons.forEach(b => this.append(b));

        if(props.mode !== undefined)
            this.mode = props.mode;

        if(props.closeOnSelect !== undefined)
            this.closeOnSelect = props.closeOnSelect;


        const click = Gtk.GestureClick.new();
        const idClick = click.connect("released", (g, gx, gy) => {
            const { x, y, width, height } = this.get_allocation();
            if(g.button !== Gdk.BUTTON_PRIMARY || 
              (gx >= x && gx <= (x+width) || (gy >= y && gy <= (y+height)))
            ) {
                return;
            }

            this.popdown();
            g.disconnect(idClick);
            this.remove_controller(g);
        });

        const key = Gtk.EventControllerKey.new();
        const idKey = key.connect("key-released", (e, key) => {
            if(key !== Gdk.KEY_Escape)
                return;

            this.popdown();
            e.disconnect(idKey);
            this.remove_controller(e);
        });
        this.add_controller(click);

        this.set_child(
            <Gtk.ListBox selectionMode={createBinding(this, "mode")(mode =>
                  mode === Menu.Mode.SELECT_MANY ?
                      Gtk.SelectionMode.MULTIPLE
                  : Gtk.SelectionMode.SINGLE
              )} activateOnSingleClick
              onRowSelected={(listbox, row) => {
                  row?.activate(); // activate row on selection
                  if(this.mode !== Menu.Mode.NORMAL && row instanceof MenuItem) {
                      const selectedRow = listbox.get_selected_row() as MenuItem|null;

                      if(selectedRow && this.mode === Menu.Mode.SELECT && selectedRow !== row)
                          selectedRow.selected = false;

                      row.selected = true;
                  }

                  if(this.mode === Menu.Mode.NORMAL) {
                      // we need to unselect the menuitem, so it works on a single click next time
                      listbox.unselect_all();
                  }

                  this.closeOnSelect &&
                      this.popdown();
              }}>

                <For each={createConnection(this.#buttons,
                    // @ts-ignore
                    [this, "added", (() => this.#buttons)],
                    [this, "removed", (() => this.#buttons)]
                )}>
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

    remove(id: number): boolean {
        const index = this.#buttons.findLastIndex(b => b.id === id);

        if(index < 0)
            return false;

        this.#buttons.splice(index, 1);
        return true;
    }

    append(button: LabelButton): number {
        if(typeof button.id !== "number")
            button.id = this.genID().next().value;
        
        this.#buttons.push(button);
        return button.id!;
    }

    prepend(button: LabelButton): number {
        if(typeof button.id !== "number")
            button.id = this.genID().next().value;

        this.#buttons.unshift(button);
        return button.id!;
    }

    toArray(): Array<LabelButton> {
        return [...this.#buttons];
    }

    protected *genID(): Generator<unknown, number, number> {
        let last: number = -1;

        while(true) {
            yield last++;
        }
    }

    connect<
        S extends keyof Menu.SignalSignatures,
        C extends Menu.SignalSignatures[S]
    >(signal: S, callback: (self: Menu, ...params: Parameters<C>) => ReturnType<C>): number {
        return super.connect(signal, callback);
    }

    emit<
        S extends keyof Menu.SignalSignatures,
        P extends Parameters<Menu.SignalSignatures[S]>
    >(signal: S, ...args: P): void {
        super.emit(signal, ...args);
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

    export type SignalSignatures = Gtk.Popover.SignalSignatures & VibeMenu.SignalSignatures & {
        "notify::close-on-select": (spec: GObject.ParamSpec<boolean>) => void;
        "notify::mode": (spec: GObject.ParamSpec<number>) => void;
    };

    export type ConstructorProps = Gtk.Popover.ConstructorProps & VibeMenu.ConstructorProps & {
        buttons: Array<Menu.Button>;
        mode: Menu.Mode;
        closeOnSelect: boolean;
    }
}
