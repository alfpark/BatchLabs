import { Component, DebugElement, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ClipboardService } from "@batch-flask/ui/electron";
import { mouseenter, mouseleave } from "test/utils/helpers";
import { TextPropertyComponent } from "./text-property.component";

@Component({
    template: `
        <bl-text-property [label]="label" [value]="value" [copyable]="copyable">
        </bl-text-property>
    `,
})
class TestComponent {
    public label: string;
    public value: string;
    public copyable: boolean = true;
}

describe("TextPropertyComponent", () => {
    let fixture: ComponentFixture<TestComponent>;
    let de: DebugElement;
    let testComponent: TestComponent;
    let section: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, TextPropertyComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                { provide: ClipboardService, useValue: {} },
            ],
        });
        fixture = TestBed.createComponent(TestComponent);
        de = fixture.debugElement;
        testComponent = fixture.componentInstance;
        section = de.query(By.css("bl-property-field"));
        fixture.detectChanges();
    });

    it("Should show the label and the value", () => {
        testComponent.label = "State";
        testComponent.value = "Running";
        fixture.detectChanges();
        const label = de.query(By.css("[propertyLabel]"));
        const value = de.query(By.css("bl-property-content"));

        expect(label).not.toBeNull();
        expect(value).not.toBeNull();

        expect(label.nativeElement.textContent).toContain("State");
        expect(value.nativeElement.textContent).toContain("Running");
    });

    it("the clipboard should be enabled by default", () => {
        const clipboard = de.query(By.css(".clipboard"));
        expect(clipboard).not.toBeNull();
        expect(clipboard).toBeHidden();
    });

    it("Should show the clipboard when mouse enter and hide when mouse leave", () => {
        mouseenter(section);
        fixture.detectChanges();
        const clipboard = de.query(By.css(".clipboard"));
        expect(clipboard).toBeVisible();

        mouseleave(section);
        fixture.detectChanges();
        expect(clipboard).toBeHidden();
    });

    describe("when clipboard is disabled", () => {
        beforeEach(() => {
            testComponent.copyable = false;
            fixture.detectChanges();
        });

        it("should not have the clipboard element", () => {
            const clipboard = de.query(By.css(".clipboard"));
            expect(clipboard).toBeNull();
        });

        it("should not show the clipboard on mouseover", () => {
            mouseenter(section);
            fixture.detectChanges();

            const clipboard = de.query(By.css(".clipboard"));
            expect(clipboard).toBeNull();
        });
    });
});
