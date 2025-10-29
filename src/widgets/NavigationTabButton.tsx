import Gtk from "gi://Gtk?version=4.0";
import { Accessor } from "gnim";
import { transform } from "gnim-utils";


export default (props: {
    iconName: string | Accessor<string>;
    label: string | Accessor<string>;
    spacing?: number | Accessor<number>;
    class?: string | Accessor<string>;
    actionClicked?: () => void;
    $?: (self: Gtk.Button) => void;
}) => {
    return <Gtk.Button class={props.class !== undefined ?
          transform(props.class, (c) => `navigation-tab-button ${c}`)
      : "navigation-tab-button flat"} $={props.$} 
      onClicked={() => props.actionClicked?.()}>
        <Gtk.Box spacing={props.spacing ?? 6}>
            <Gtk.Image iconName={props.iconName} />
            <Gtk.Label label={props.label} xalign={0} />
        </Gtk.Box>
    </Gtk.Button>;
}
