import Gtk from "gi://Gtk?version=4.0";
import Page from "../widgets/Page";
import { createBinding, createState, With } from "gnim";
import PluginHandler from "../plugins/plugin-handler";
import { Plugin, Section as SectionType } from "libvibe";
import Section from "../widgets/Section";
import { register } from "gnim/gobject";
import Adw from "gi://Adw?version=1";


@register({ GTypeName: "VibePageHome" })
export default class Home extends Page {

    constructor() {
        super({
            tabName: "Home",
            title: "Recommendations",
            iconName: "go-home-symbolic"
        });

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <With value={createBinding(PluginHandler.getDefault(), "plugin")}>
                    {(plugin: Plugin) => {
                        const [finished, setFinished] = createState(false);
                        let sections: Array<SectionType>;

                        if(plugin.implements.sections) {
                            const result = plugin.getSections();

                            if(result instanceof Promise) {
                                plugin.getSections()!.then((sects) => {
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

                        return plugin.implements.sections ?
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
