import Adw from "gi://Adw?version=1";
import { property, register } from "gnim/gobject";
import { Page } from "../widgets/Page";
import { Vibe } from "libvibe";


@register({ GTypeName: "VibeTab" })
export default class Tab extends Adw.Bin {

    readonly id: any;

    #page: Page|null = null;

    /** icon of the page/tab, displayed in the sidebar together
    * with its name */
    @property(String)
    iconName: string = "tab-new-symbolic";

    /** name of the tab, displayed in the sidebar together 
    * with the icon */
    @property(String)
    title: string;

    /** get the page for this tab, can be null (usually won't be) */
    get page() { return this.#page; }

    /** set the page for this tab. you can't set this if it was already set before */
    set page(newPage: Page|null) {
        if(this.#page || newPage === null)
            throw new Error("Cannot set the page of a Tab after it has already been set");

        this.#page = newPage;
    }

    constructor(props: {
        title: string;
        iconName?: string;
        id?: any;
        page?: Page;
    }) {
        super();

        this.set_hexpand(true);
        this.set_vexpand(true);
        this.add_css_class("tab");
        this.title = props.title;
        if(props.page !== undefined)
            this.#page = props.page;

        this.id = props.id ?? Vibe.getDefault().generateID();

        if(props.iconName !== undefined)
            this.iconName = props.iconName;
    }
}
