import Adw from "gi://Adw?version=1";
import { property, register } from "gnim/gobject";


@register({ GTypeName: "VibePage" })
export default class Page extends Adw.Bin {

    /** icon of the page/tab, displayed in the sidebar together
    * with its name */
    @property(String)
    iconName: string = "tab-new-symbolic";

    /** name of the page/tab, displayed in the sidebar together 
    * with the icon */
    @property(String)
    tabName: string;

    /** page's title, shows up in the HeaderBar widget in the 
    * app window */
    @property(String)
    title: string;

    constructor(props: {
        tabName: string;
        iconName?: string;
        title?: string;
    }) {
        super();

        this.set_hexpand(true);
        this.set_vexpand(true);
        this.add_css_class("page");
        this.tabName = props.tabName;
        this.title = props.title !== undefined ?
            props.title
        : this.tabName;

        if(props.iconName !== undefined)
            this.iconName = props.iconName;
    }
}
