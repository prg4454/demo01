import { Component, inject, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import CDK Dialog services
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface NasalSpray2Record {
    id: number;
    brandName: string;
    genericName: string;
    strength: string;
    category: 'Steroid' | 'Saline' | 'Antihistamine' | 'Decongestant';
    dose: string;
    usage: string;
    comments: string;
    manufacturer: string;
    lastOpened: string;
}

export interface NasalSprays2EditData {
    spray: NasalSpray2Record;
    allowDelete?: boolean;
}



export interface NasalSprays2EditResult {
    action: 'save' | 'delete';
    spray: NasalSpray2Record;
}

export interface ChangedField {
    label: string;
    before: string;
    after: string;
}

@Component({
    selector: 'app-nasal-sprays2-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './nasal-sprays2-edit.component.html',
    styleUrl: './nasal-sprays2-edit.component.scss'
})
export class NasalSprays2EditComponent implements OnInit {
    // 1. Inject DialogRef to enable closing the dialog and sending a result back.
    dialogRef = inject<DialogRef<NasalSprays2EditResult>>(DialogRef);

    // 2. Inject DIALOG_DATA to retrieve the custom input object passed when opening this dialog.
    data = inject<NasalSprays2EditData>(DIALOG_DATA);

    // Reference to the HTML native <dialog> element for unsaved changes warning.
    @ViewChild('unsavedDialog') unsavedDialogEl!: ElementRef<HTMLDialogElement>;
    private unsavedResolver: ((discard: boolean) => void) | null = null;

    // Reference to the HTML native <dialog> element for delete confirmation.
    @ViewChild('deleteConfirmDialog') deleteConfirmDialogEl!: ElementRef<HTMLDialogElement>;
    private deleteResolver: ((confirm: boolean) => void) | null = null;

    private historyPushed = false;
    private closingFromPopState = false;
    private ignoreNextPopState = false;

    editDraft!: NasalSpray2Record;
    originalDraft!: NasalSpray2Record;
    readonly categories: NasalSpray2Record['category'][] = ['Steroid', 'Saline', 'Antihistamine', 'Decongestant'];

    ngOnInit(): void {
        // Clone the data to avoid mutating the list row before save is confirmed.
        const spray = this.data.spray;
        this.editDraft = {
            ...structuredClone(spray),
            lastOpened: spray.lastOpened || ''
        };
        this.originalDraft = structuredClone(this.editDraft);

        // Push history state so browser back button works like cancel button
        if (typeof window !== 'undefined') {
            window.history.pushState({ nasalSprays2Dialog: true }, '');
            this.historyPushed = true;
            this.closingFromPopState = false;
        }
    }

    private closeDialog(result?: NasalSprays2EditResult): void {
        if (this.historyPushed) {
            this.historyPushed = false;
            if (this.closingFromPopState) {
                this.closingFromPopState = false;
            } else if (typeof window !== 'undefined') {
                this.ignoreNextPopState = true;
                window.history.back();
            }
        }
        this.dialogRef.close(result);
    }

    @HostListener('window:popstate', ['$event'])
    onPopState(event: PopStateEvent): void {
        if (this.ignoreNextPopState) {
            this.ignoreNextPopState = false;
            return;
        }

        // Browser back button pressed while dialog is open -> act like cancel button
        this.closingFromPopState = true;
        this.cancel();
    }

    onUnsavedCancel(event: Event): void {
        event.preventDefault();
        this.closeUnsavedDialog(false);
    }

    onDeleteConfirmCancel(event: Event): void {
        event.preventDefault();
        this.closeDeleteDialog(false);
    }

    @HostListener('window:keydown.escape', ['$event'])
    onEscape(event: Event): void {
        if (this.unsavedDialogEl?.nativeElement?.open) {
            event.preventDefault();
            this.closeUnsavedDialog(false);
            return;
        }
        if (this.deleteConfirmDialogEl?.nativeElement?.open) {
            event.preventDefault();
            this.closeDeleteDialog(false);
            return;
        }
        event.preventDefault();
        this.cancel();
    }

    // 3. Listen to beforeunload event (browser refresh or tab closure) to alert user.
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = ''; // Trigger default browser reload confirmation dialog
        }
    }

    // 4. Compare current draft form properties against initial values to check for unsaved edits.
    hasUnsavedChanges(): boolean {
        return JSON.stringify(this.editDraft) !== JSON.stringify(this.originalDraft);
    }

    // 5. Gather the delta list comparing old values vs modified values.
    getUnsavedChanges(): ChangedField[] {
        const changes: ChangedField[] = [];
        const before = this.originalDraft;
        const after = this.editDraft;

        if (before.brandName !== after.brandName) {
            changes.push({ label: 'Brand Name', before: before.brandName, after: after.brandName });
        }
        if (before.genericName !== after.genericName) {
            changes.push({ label: 'Generic Name', before: before.genericName, after: after.genericName });
        }
        if (before.strength !== after.strength) {
            changes.push({ label: 'Strength', before: before.strength, after: after.strength });
        }
        if (before.category !== after.category) {
            changes.push({ label: 'Category', before: before.category, after: after.category });
        }
        if (before.dose !== after.dose) {
            changes.push({ label: 'Dose', before: before.dose, after: after.dose });
        }
        if (before.usage !== after.usage) {
            changes.push({ label: 'Usage', before: before.usage, after: after.usage });
        }
        if (before.comments !== after.comments) {
            changes.push({ label: 'Comments', before: before.comments, after: after.comments });
        }
        if (before.manufacturer !== after.manufacturer) {
            changes.push({ label: 'Manufacturer', before: before.manufacturer, after: after.manufacturer });
        }
        if (before.lastOpened !== after.lastOpened) {
            changes.push({ label: 'Last Opened', before: before.lastOpened, after: after.lastOpened });
        }
        return changes;
    }

    // 6. Open the native HTML <dialog> element for unsaved changes and return a Promise.
    confirmDiscardWithHtmlDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.unsavedResolver = resolve;
            const dialog = this.unsavedDialogEl.nativeElement;
            dialog.showModal();
        });
    }

    // 7. Called by click events on the native HTML unsaved warning dialog action buttons.
    closeUnsavedDialog(discard: boolean): void {
        const dialog = this.unsavedDialogEl.nativeElement;
        dialog.close();
        if (this.unsavedResolver) {
            this.unsavedResolver(discard);
            this.unsavedResolver = null;
        }
    }

    // 8. Open the native HTML <dialog> element for delete confirmation and return a Promise.
    confirmDeleteWithHtmlDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.deleteResolver = resolve;
            const dialog = this.deleteConfirmDialogEl.nativeElement;
            dialog.showModal();
        });
    }

    // 9. Called by click events on the native HTML delete confirmation dialog action buttons.
    closeDeleteDialog(confirm: boolean): void {
        const dialog = this.deleteConfirmDialogEl.nativeElement;
        dialog.close();
        if (this.deleteResolver) {
            this.deleteResolver(confirm);
            this.deleteResolver = null;
        }
    }

    // Standard client-side validator to disable Save if any required text fields are empty.
    canSave(): boolean {
        if (!this.editDraft) return false;
        return (this.editDraft.brandName?.trim() ?? '').length > 0
            && (this.editDraft.genericName?.trim() ?? '').length > 0
            && (this.editDraft.strength?.trim() ?? '').length > 0
            && (this.editDraft.dose?.trim() ?? '').length > 0
            && (this.editDraft.usage?.trim() ?? '').length > 0;
    }

    save(): void {
        if (!this.canSave()) {
            return;
        }
        // Close the dialog and pass the saved spray draft back.
        this.closeDialog({
            action: 'save',
            spray: {
                ...this.editDraft,
                brandName: (this.editDraft.brandName ?? '').trim(),
                genericName: (this.editDraft.genericName ?? '').trim(),
                strength: (this.editDraft.strength ?? '').trim(),
                dose: (this.editDraft.dose ?? '').trim(),
                usage: (this.editDraft.usage ?? '').trim(),
                comments: (this.editDraft.comments ?? '').trim(),
                manufacturer: (this.editDraft.manufacturer ?? '').trim(),
                lastOpened: (this.editDraft.lastOpened ?? '').trim()
            }
        });
    }

    delete(): void {
        // Open the native HTML delete dialog and wait for confirmation.
        this.confirmDeleteWithHtmlDialog().then((isConfirmed) => {
            if (isConfirmed) {
                // Close the dialog and pass 'delete' action back.
                this.closeDialog({
                    action: 'delete',
                    spray: this.editDraft
                });
            }
        });
    }

    cancel(): void {
        // If there are unsaved changes, prompt the user with the native HTML dialog first.
        if (this.hasUnsavedChanges()) {
            this.confirmDiscardWithHtmlDialog().then(discard => {
                if (discard) {
                    this.closeDialog();
                } else {
                    // If user pressed browser back and then chose "Keep Editing", restore the history entry
                    if (this.closingFromPopState) {
                        this.closingFromPopState = false;
                        if (typeof window !== 'undefined') {
                            window.history.pushState({ nasalSprays2Dialog: true }, '');
                            this.historyPushed = true;
                        }
                    }
                }
            });
            return;
        }
        // Close the dialog without passing any result (undefined).
        this.closeDialog();
    }
}
