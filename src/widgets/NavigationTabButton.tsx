import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor } from "gnim";


export default (props: {
    iconName: string | Accessor<string>;
    label: string | Accessor<string>;
    view?: Adw.NavigationView;
    page?: Adw.NavigationPage;
    spacing?: number | Accessor<number>;
    $?: (self: Gtk.Button) => void;
}) => {
    return <Gtk.Button class={"navigation-tab-button flat"} $={props.$} onClicked={() => {
       if(props.view && props.page) {
            props.view.push(props.page);
        }
    }}>
        <Gtk.Box spacing={props.spacing ?? 6}>
            <Gtk.Image iconName={props.iconName} />
            <Gtk.Label label={props.label} xalign={0} />
        </Gtk.Box>
    </Gtk.Button>;
}
