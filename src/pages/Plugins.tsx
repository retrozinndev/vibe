import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createComputed, For } from "gnim";
import { register } from "gnim/gobject";
import { Plugin } from "libvibe/plugin";
import PluginHandler from "../plugins/plugin-handler";
import Card from "../widgets/Card";
import Page from "../widgets/Page";


@register({ GTypeName: "VibePagePlugins" })
export default class Plugins extends Page {
    constructor() {
        super({
            tabName: "Plugins",
            iconName: "folder-extensions-symbolic",
            title: "Manage plugins"
        });

        const plugins = createBinding(PluginHandler.getDefault(), "plugins");
        const builtIn = plugins.as(pls => pls.filter(pl => 
            PluginHandler.getDefault().isBuiltin(pl)
        ));
        const external = plugins.as(pls => pls.filter(pl =>
            !PluginHandler.getDefault().isBuiltin(pl)
        ));

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>

                {/* built-in plugins */}
                <Gtk.Label class={"title-1"} label={"Built-in"} xalign={0} />
                <Gtk.FlowBox minChildrenPerLine={1}>
                    <For each={builtIn}>
                        {(plugin: Plugin) => 
                            <Card title={plugin.name} description={createComputed([
                                  createBinding(plugin, "description"),
                                  createBinding(plugin, "status")
                              ], (desc, status) => 
                                  `${desc} - ${status.replace(/^./, (c) => c.toUpperCase())}`
                              )}
                            />
                        }
                    </For>
                </Gtk.FlowBox>
                
                {/* external plugins */}
                <Gtk.Label class={"title-1"} label={"External Plugins"} xalign={0} />
                <Gtk.FlowBox minChildrenPerLine={1}>
                    <For each={external}>
                        {(plugin: Plugin) => 
                            <Card title={plugin.name} description={createComputed([
                                  createBinding(plugin, "description"),
                                  createBinding(plugin, "status")
                              ], (desc, status) => 
                                  `${desc} - ${status.replace(/^./, (c) => c.toUpperCase())}`
                              )}
                            />
                        }
                    </For>
                </Gtk.FlowBox>
            </Gtk.Box> as Gtk.Box
        );
    }
}
