import { PageModal } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import Tab from "../widgets/Tab";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, For } from "gnim";
import PluginHandler from "../plugins/plugin-handler";
import { Plugin } from "libvibe/plugin";
import Card from "../widgets/Card";
import { register } from "gnim/gobject";


@register({ GTypeName: "VibePluginPage" })
export class PluginPage extends Page<PageModal.CUSTOM> {

    constructor(tab: Tab) {
        super({
            modal: PageModal.CUSTOM,
            title: "Your plugins",
            id: "plugins",
            tab
        });
        
        this.get_content_widget().append(
            <Gtk.Label class={"title-1"} label={"Plugins"} xalign={0} /> as Gtk.Label
        );
        this.get_content_widget().append(
            <Gtk.FlowBox homogeneous={false} hexpand={false}>
                <For each={createBinding(PluginHandler.getDefault(), "plugins")}>
                    {(plugin: Plugin) => 
                        <Card title={plugin.prettyName} description={createBinding(plugin, "description")}
                          buttonAlign={Gtk.Align.CENTER} buttons={[
                              {
                                  iconName: "user-trash-symbolic",
                                  onClicked: () => {
                                      // TODO uninstall the plugin (call ::uninstall-request signal, and stuff...)
                                  }
                              }, {
                                  iconName: "folder-globe-symbolic",
                                  onClicked: () => {
                                      // TODO open plugin url if specified
                                  }
                              }
                          ]}
                        />
                    }
                </For>
            </Gtk.FlowBox> as Gtk.FlowBox
        );
    }
}
