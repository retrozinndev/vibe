import Gtk from "gi://Gtk?version=4.0";
import GObject, { getter, gtype, register, signal } from "gnim/gobject";
import { Page, PagesSignalSignatures, Pages as VibePages } from "libvibe/interfaces";
import { createScopedConnection, omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibePagesWidget" })
export class Pages extends Gtk.Stack implements VibePages {
    declare $signals: PagesSignalSignatures;

    #history: Array<Page> = [];
    #page: Page;

    @getter(gtype<Page>(GObject.Object))
    get currentPage() { return this.#page; }

    @getter(Array)
    get history() { return this.#history; }

    @signal(gtype<Page>(GObject.Object))
    added(_: Page) {}

    @signal(gtype<Page>(GObject.Object))
    removed(_: Page) {}


    constructor(props: {
        initialPage: Page
    } & Partial<Gtk.Stack.ConstructorProps>) {
        super(omitObjectKeys(props, [ "initialPage" ]));

        this.#page = props.initialPage;

        createScopedConnection<typeof this, "notify::visible-child">(
            this, "notify::visible-child", () => {
                const visibleChild = this.get_visible_child();

                this.#page = visibleChild as Page;
                this.notify("current-page");
            }
        );
        
        createScopedConnection<typeof this, "added">(
            this, "added", (page) => {
                const name = String(page.id);

                this.add_named(page, name);
                this.set_visible_child_name(name);
            }
        );

        createScopedConnection<typeof this, "removed">(
            this, "removed", (rmPage) => {
                const name = String(rmPage.id);

                this.set_visible_child_name(
                    String(this.#history[this.#history.length - 1].id));

                setTimeout(() => {
                    this.remove(this.get_child_by_name(name)!)
                }, this.transitionDuration);
            }
        );
    }

    public addPage(page: Page): void {
        for(let i = 0; i < this.#history.length; i++) {
            const p = this.#history[i];

            if(p.id === page.id && i < this.#history.length) {
                this.#history.splice(i+1, this.#history.length - i);
                this.notify("history");
                this.#page = page;
                this.notify("current-page");
                return;
            }
        }

        this.#history.push(page);
        this.notify("history");
        this.#page = page;
        this.notify("current-page");
    }

    back(numOfPages?: number): void {
        if(this.#history.length <= 1 || (numOfPages && numOfPages < 1)) 
            return;

        let targetIndex: number = this.#history.length - 2;

        if(numOfPages && numOfPages < this.#history.length) 
            targetIndex = this.#history.length - numOfPages;

        this.#page = this.#history[targetIndex];
        this.notify("current-page");
        this.#history.splice(targetIndex, this.#history.length - targetIndex);
    }
}
