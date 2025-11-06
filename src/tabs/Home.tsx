import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createState, With } from "gnim";
import { register } from "gnim/gobject";
import { Section as SectionType } from "libvibe";
import { Plugin } from "libvibe/plugin";
import PluginHandler from "../plugins/plugin-handler";
import Tab from "../widgets/Tab";
import Section from "../widgets/Section";
import { createSubscription } from "gnim-utils";


@register({ GTypeName: "VibeTabHome" })
export default class Home extends Tab {

    constructor() {
        super({
            tabName: "Home",
            title: "Recommendations",
            iconName: "go-home-symbolic"
        });

        // show only if it's implemented by the plugin
        createSubscription(
            createBinding(PluginHandler.getDefault(), "plugin"),
            () => this.set_visible(
                PluginHandler.getDefault().plugin.isImplemented("recommendations")
            )
        );

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <With value={createBinding(PluginHandler.getDefault(), "plugin")}>
                    {(plugin: Plugin) => {
                        const [finished, setFinished] = createState(false);
                        let sections: Array<SectionType>;

                        if(plugin.isImplemented("recommendations")) {
                            const result = plugin.getRecommendations();

                            if(result instanceof Promise) {
                                result.then((sects) => {
                                    if(!sects) return;
                                    sections = sects;
                                    setFinished(true);
                                });
                            } else {
                                if(result != null) {
                                    sections = result;
                                    setFinished(true);
                                }
                            }
                        }

                        return plugin.isImplemented("recommendations") ?
                            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                                <With value={finished}>
                                    {(hasFinished: boolean) =>
                                        hasFinished ?
                                            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}
                                              children={sections.map(section => 
                                                  <Section {...section} />
                                              )}
                                            />
                                        : <Adw.Spinner />
                                    }
                                </With>
                            </Gtk.Box>
                        : <Gtk.Label label={"This plugin does not implement sections. Sorry for the inconvenience"} />
                    }}
                </With>
            </Gtk.Box> as Gtk.Box
        );
    }
}
