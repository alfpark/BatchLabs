import { NgModule } from "@angular/core";

import { commonModules } from "app/common";
import { FileBrowseModule } from "app/components/file/browse";
import { NodeBrowseModule } from "app/components/node/browse";
import { NodeConnectModule } from "app/components/node/connect";
import {
    NodeConfigurationComponent, NodeDefaultComponent, NodeDetailsComponent,
    NodeErrorDisplayComponent, StartTaskErrorDisplayComponent,
} from "app/components/node/details";
import { NodeHomeComponent } from "app/components/node/home";
import { PoolGraphsModule } from "app/components/pool/graphs";

const components = [
    NodeConfigurationComponent, NodeDefaultComponent, NodeDetailsComponent, NodeHomeComponent,
    StartTaskErrorDisplayComponent, NodeErrorDisplayComponent,
];

const modules = [
    FileBrowseModule, NodeBrowseModule, NodeConnectModule,
];

@NgModule({
    declarations: components,
    exports: [...modules, ...components],
    imports: [...modules, ...commonModules, PoolGraphsModule] ,
    entryComponents: [
    ],
})
export class NodeModule {
}
