import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { autobind } from "@batch-flask/core";
import { Subscription } from "rxjs/Subscription";

import { DialogService } from "@batch-flask/ui/dialogs";
import { SidebarManager } from "@batch-flask/ui/sidebar";
import { DownloadFolderComponent } from "app/components/common/download-folder-dialog";
import { BlobContainer } from "app/models";
import { ApplicationDecorator } from "app/models/decorators";
import { FileGroupCreateDto } from "app/models/dtos";
import { GetContainerParams, StorageService } from "app/services";
import { EntityView } from "app/services/core";
import { DeleteContainerDialogComponent, FileGroupCreateFormComponent } from "../action";

@Component({
    selector: "bl-data-details",
    templateUrl: "data-details.html",
})
export class DataDetailsComponent implements OnInit, OnDestroy {
    public static breadcrumb({ id }, { tab }) {
        const label = tab ? `File group - ${tab}` : "File group";
        return {
            name: id,
            label,
        };
    }

    public container: BlobContainer;
    public containerId: string;
    public decorator: ApplicationDecorator;
    public data: EntityView<BlobContainer, GetContainerParams>;
    public isFileGroup = false;

    private _paramsSubscriber: Subscription;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private activatedRoute: ActivatedRoute,
        private dialog: DialogService,
        private router: Router,
        private sidebarManager: SidebarManager,
        private storageService: StorageService) {

        this.data = this.storageService.containerView();
        this.data.item.subscribe((container) => {
            this.container = container;
            this.isFileGroup = container && container.isFileGroup;
            changeDetector.markForCheck();
        });

        this.data.deleted.subscribe((key) => {
            if (this.containerId === key) {
                this.router.navigate(["/data"]);
            }
        });
    }

    public ngOnInit() {
        this._paramsSubscriber = this.activatedRoute.params.subscribe((params) => {
            this.containerId = params["id"];
            this.data.params = { id: this.containerId };
            this.data.fetch();
            this.changeDetector.markForCheck();
        });
    }

    public ngOnDestroy() {
        this._paramsSubscriber.unsubscribe();
    }

    @autobind()
    public manageFileGroup() {
        const sidebarRef = this.sidebarManager.open("Maintain a file group", FileGroupCreateFormComponent);
        sidebarRef.component.setValue(new FileGroupCreateDto({
            name: this.container.name,
            includeSubDirectories: true,
            folder: null,
        }));

        sidebarRef.afterCompletion.subscribe(() => {
            this.storageService.onContainerUpdated.next();
        });
    }

    @autobind()
    public deleteFileGroup() {
        const dialogRef = this.dialog.open(DeleteContainerDialogComponent);
        dialogRef.componentInstance.id = this.container.id;
        dialogRef.componentInstance.name = this.container.name;
    }

    @autobind()
    public refresh() {
        return this.data.refresh();
    }

    @autobind()
    public download() {
        const ref = this.dialog.open(DownloadFolderComponent);
        ref.componentInstance.navigator = this.storageService.navigateContainerBlobs(this.containerId);
        ref.componentInstance.subfolder = this.containerId;
        ref.componentInstance.folder = "";
    }
}
