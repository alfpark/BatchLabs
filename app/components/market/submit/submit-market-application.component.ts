import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NcjJobTemplate, NcjPoolTemplate, ServerError } from "app/models";
import { NcjTemplateService, PythonRpcService } from "app/services";
import { autobind } from "core-decorators";
import { Modes, NcjParameterWrapper } from "./market-application.model";
import "./submit-market-application.scss";

@Component({
    selector: "bl-submit-market-application",
    templateUrl: "submit-market-application.html",
})
export class SubmitMarketApplicationComponent implements OnInit {
    public static breadcrumb() {
        return { name: "Submit" };
    }
    public Modes = Modes;
    public modeState = Modes.None;
    public title: string;
    public form: FormGroup;
    public jobTemplate: NcjJobTemplate;
    public poolTemplate: NcjPoolTemplate;
    public pickedPool = new FormControl(null, Validators.required);
    public jobParams: FormGroup;
    public poolParams: FormGroup;
    public jobParametersWrapper: NcjParameterWrapper[];
    public poolParametersWrapper: NcjParameterWrapper[];
    private applicationId: string;
    private actionId: string;
    private icon: string;
    private error: ServerError;

    constructor(
        public formBuilder: FormBuilder,
        private pythonRpcService: PythonRpcService,
        private route: ActivatedRoute,
        private router: Router,
        private templateService: NcjTemplateService) {
        this.form = new FormGroup({});
    }

    public ngOnInit() {
        this.route.params.subscribe((params) => {
            this.applicationId = params["applicationId"];
            this.actionId = params["actionId"];
            this.title = `Run ${this.actionId} from ${this.applicationId}`;
            this.templateService.getTemplates(this.applicationId, this.actionId).subscribe((templates) => {
                this.jobTemplate = templates.job;
                this.poolTemplate = templates.pool;
                this._parseParameters();
                this._createForms();
            });
            this.templateService.getApplication(this.applicationId).subscribe((application) => {
                this.icon = application.icon;
            });
        });
    }

    public pickMode(mode: Modes) {
        this.modeState = mode;
    }

    public getToolTip(): string {
        if (this.isFormValid()) {
            return "Click to submit form";
        }
        return "Form is not valid";
    }

    public isFormValid() {
        return (this.modeState ===  Modes.NewPoolAndJob && this.jobParams.valid && this.poolParams.valid) ||
            (this.modeState ===  Modes.ExistingPoolAndJob && this.jobParams.valid && this.pickedPool.valid) ||
            (this.modeState ===  Modes.NewPool && this.poolParams.valid);
    }

    @autobind()
    public submit() {
        this.error = null;
        let obs;
        switch (this.modeState) {
            case Modes.NewPoolAndJob: {
                obs = this.pythonRpcService.callWithAuth("expand-ncj-pool", [this.poolTemplate, this.poolParams.value])
                    .cascade((data) => this._runJobWithPool(data));
                break;
            }
            case Modes.ExistingPoolAndJob: {
                this.jobTemplate.job.properties.poolInfo = this.pickedPool.value;
                obs = this.pythonRpcService.callWithAuth("submit-ncj-job", [this.jobTemplate, this.jobParams.value])
                    .cascade((data) => this._redirectToJob(data.properties.id));
                break;
            }
            case Modes.NewPool: {
                obs = this.pythonRpcService.callWithAuth("create-ncj-pool", [this.poolTemplate, this.poolParams.value])
                    .cascade((data) => this._redirectToPool(data.id));
                break;
            }
            default: {
                return obs;
            }
        }
        if (obs) {
            obs.subscribe({
                error: (err) => this.error = ServerError.fromPython(err),
            });
        }
        return obs;
    }

    private _parseParameters() {
        const jobParameters = this.jobTemplate.parameters;
        const jobTempWrapper: any[] = [];
        for (let name of Object.keys(jobParameters)) {
            const param = jobParameters[name];
            jobTempWrapper.push(new NcjParameterWrapper(name, param));
        }
        this.jobParametersWrapper = jobTempWrapper;
        const poolParameters = this.poolTemplate.parameters;
        const poolTempWrapper: any[] = [];
        for (let name of Object.keys(poolParameters)) {
            const param = poolParameters[name];
            poolTempWrapper.push(new NcjParameterWrapper(name, param));
        }
        this.poolParametersWrapper = poolTempWrapper;
    }

    private _getFormGroup(template): FormGroup {
        let templateParameters = [];
        if (template && template.parameters) {
            templateParameters = Object.keys(template.parameters);
        }
        const templateFormGroup = {};
        for (let key of templateParameters) {
            if (template.parameters[key].defaultValue) {
                const defaultValue = String(template.parameters[key].defaultValue);
                templateFormGroup[key] = new FormControl(defaultValue, Validators.required );
            } else {
                templateFormGroup[key] = new FormControl(null, Validators.required);
            }
        }
        return new FormGroup(templateFormGroup);
    }

    private _createForms() {
        this.jobParams = this._getFormGroup(this.jobTemplate);
        this.poolParams = this._getFormGroup(this.poolTemplate);
        this.form = this.formBuilder.group({ pool: this.poolParams, job: this.jobParams, poolpicker: this.pickedPool });
    }

    private _runJobWithPool(expandedPoolTemplate) {
        delete expandedPoolTemplate.id;
        this.jobTemplate.job.properties.poolInfo = {
            autoPoolSpecification: {
                autoPoolIdPrefix: "autopool",
                poolLifetimeOption: "job",
                keepAlive: false,
                pool: expandedPoolTemplate,
            },
        };
        return this.pythonRpcService.callWithAuth("submit-ncj-job", [this.jobTemplate, this.jobParams.value])
            .cascade((data) => this._redirectToJob(data.properties.id));
    }

    private _redirectToJob(id) {
        if (id) {
            this.router.navigate(["/jobs", id]);
        } else {
            this.router.navigate(["/jobs"]);
        }
    }

    private _redirectToPool(id) {
        if (id) {
            this.router.navigate(["/pools", id]);
        } else {
            this.router.navigate(["/pools"]);
        }
    }
}