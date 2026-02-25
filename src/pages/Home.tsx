import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createRoot, getScope, Scope } from "gnim";
import { Section as SectionType, Vibe } from "libvibe";
import PluginHandler from "../plugins/plugin-handler";
import { Page } from "../widgets/Page";
import Section from "../widgets/Section";
import { register } from "gnim/gobject";
import { createScopedConnection, createSubscription } from "gnim-utils";


@register({ GTypeName: "VibeHomePage" })
export class Home extends Page {
    #scope: Scope = createRoot(() => getScope());

    constructor() {
        super({
            id: "home",
            title: "Recommendations",
            tabName: "Home",
            iconName: "go-home-symbolic",
            content: <Gtk.Stack transitionType={Gtk.StackTransitionType.CROSSFADE} /> as Gtk.Stack
        });

        this.#scope.run(() => {
            createScopedConnection(this, "destroy", () => this.#scope.dispose());
            createScopedConnection(this, "refresh", () => this.reload());
            createSubscription(
                createBinding(PluginHandler.getDefault(), "plugin"),
                () => PluginHandler.getDefault().plugin && this.reload()
            );
        });

        (this.content as Gtk.Stack).add_named(
            <Adw.Spinner hexpand vexpand /> as Gtk.Widget, "spinner"
        );

        this.reload();
    }

    reload(): void {
        const stack = this.content as Gtk.Stack;
        const plugin = PluginHandler.getDefault().plugin;

        stack.set_visible(true);
        stack.set_visible_child_name("spinner");

        if(!plugin.isImplemented("recommendations")) {
            stack.set_visible(false);
            Vibe.getDefault().addDialog({
                title: "Unsupported",
                content: `The ${plugin.prettyName} plugin does not provide the "recommendations"(home screen) feature!\nMaybe it's just a non-content plugin?`,
                canClose: true
            });
            return;
        }

        // TODO support length and offset properties on overshoot-scroll
        const promise = plugin.getRecommendations();

        if(promise instanceof Promise) {
            promise.then(sections => this.setupContent(stack, sections)).catch(e => {
                console.error(e);
                if((e as Error).message.trim() !== "")
                    Vibe.getDefault().addDialog({
                        title: "Error",
                        content: `The plugin returned an error while trying to get recommendations: ${(e as Error).message}`,
                        canClose: true
                    });
            });
            return;
        }

        try {
            this.setupContent(stack, promise);
        } catch(e) {
            console.error(e);
            if((e as Error).message.trim() !== "")
                Vibe.getDefault().addDialog({
                    title: "Error",
                    content: `The plugin returned an error while trying to get recommendations: ${(e as Error).message}`,
                    canClose: true
                });
        }
    }

    private setupContent(stack: Gtk.Stack, sections: Array<SectionType>|null): void {
        const contentPage = stack.get_child_by_name("content");
        if(contentPage)
            stack.remove(contentPage);

        this.#scope.run(() => {
            stack.add_named(
                <Gtk.Box>
                    {sections && sections.map(sect =>
                        <Section {...sect} />
                    )}
                </Gtk.Box> as Gtk.Box,
                "content"
            );
        });
        stack.set_visible_child_name("content");
    }
}
