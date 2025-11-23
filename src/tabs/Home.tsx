import { createBinding } from "gnim";
import { createSubscription } from "gnim-utils";
import { register } from "gnim/gobject";
import { Home as HomePage } from "../pages/Home";
import PluginHandler from "../plugins/plugin-handler";
import Tab from "../widgets/Tab";


@register({ GTypeName: "VibeTabHome" })
export default class Home extends Tab {

    constructor() {
        super({
            title: "Home",
            id: "home",
            iconName: "go-home-symbolic"
        });

        this.page = new HomePage(this);

        // show only if it's implemented by the plugin
        createSubscription(
            createBinding(PluginHandler.getDefault(), "plugin"),
            () => this.set_visible(
                PluginHandler.getDefault().plugin.isImplemented("recommendations")
            )
        );
    }
}
