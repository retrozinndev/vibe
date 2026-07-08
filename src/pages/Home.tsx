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
            title: "For You",
            tabName: "Home",
            iconName: "go-home-symbolic",
            content: new Gtk.Box({ visible: true })
        });

        this.#scope.run(() => {
            createScopedConnection(this, "destroy", () => this.#scope.dispose());
            createScopedConnection(this, "refresh", () => this.reload());
            createSubscription(
                createBinding(PluginHandler.getDefault(), "plugin"),
                () => PluginHandler.getDefault().plugin && this.reload()
            );
        });

        this.reload();
    }

    reload(): void {
        const plugin = PluginHandler.getDefault().plugin;
        this.loading = true;

        if(!plugin.isImplemented("recommendations")) {
            this.loading = false;
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
            promise.then(sections => this.setupContent(sections)).catch(e => {
                console.error(e);
                if((e as Error).message.trim() !== "")
                    Vibe.getDefault().addDialog({
                        title: "Error",
                        content: `The plugin returned an error while trying to get recommendations:\n${(e as Error).message}`,
                        canClose: true
                    });
            }).finally(() => this.loading = false);
            return;
        }

        try {
            this.setupContent(promise);
        } catch(e) {
            console.error(e);
            if((e as Error).message.trim() !== "")
                Vibe.getDefault().addDialog({
                    title: "Error",
                    content: `The plugin returned an error while trying to get recommendations:\n${(e as Error).message}`,
                    canClose: true
                });
        }
        this.loading = false;
    }

    private setupContent(sections: Array<SectionType>|null): void {
        if(this.getContent())
            this.setContent(new Gtk.Box({ visible: true }));

        this.#scope.run(() => {
            if(!sections)
                return;

            for(const section of sections) {
                (this.getContent() as Gtk.Box).append(
                    <Section {...section} /> as Section
                );
            }
        });
    }
}
