import { Component, inject, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import CDK Dialog services
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface CatRecord {
    id: number;
    name: string;
    breed: string;
    owner: string;
    reason: string;
    checkIn: string;
    status: 'Waiting' | 'Exam' | 'Treatment' | 'Ready';
    vet: string;
    nextAppointment: string;
}

export interface Cats2EditData {
    cat: CatRecord;
    allowDelete?: boolean;
}

export interface Cats2EditResult {
    action: 'save' | 'delete';
    cat: CatRecord;
}

export interface ChangedField {
    label: string;
    before: string;
    after: string;
}

@Component({
    selector: 'app-cats2-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cats2-edit.component.html',
    styleUrl: './cats2-edit.component.scss'
})
export class Cats2EditComponent implements OnInit {
    // 1. Inject DialogRef to enable closing the dialog and sending a result back.
    dialogRef = inject<DialogRef<Cats2EditResult>>(DialogRef);

    // 2. Inject DIALOG_DATA to retrieve the custom input object passed when opening this dialog.
    data = inject<Cats2EditData>(DIALOG_DATA);

    // Reference to the HTML native <dialog> element for unsaved changes warning.
    @ViewChild('unsavedDialog') unsavedDialogEl!: ElementRef<HTMLDialogElement>;
    private unsavedResolver: ((discard: boolean) => void) | null = null;

    // Reference to the HTML native <dialog> element for delete confirmation.
    @ViewChild('deleteConfirmDialog') deleteConfirmDialogEl!: ElementRef<HTMLDialogElement>;
    private deleteResolver: ((confirm: boolean) => void) | null = null;

    editDraft!: CatRecord;
    originalDraft!: CatRecord;
    readonly statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

    ngOnInit(): void {
        // Clone the data to avoid mutating the list row before save is confirmed.
        const cat = this.data.cat;
        this.editDraft = {
            ...structuredClone(cat),
            nextAppointment: cat.nextAppointment || ''
        };
        this.originalDraft = structuredClone(this.editDraft);
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

        if (before.name !== after.name) {
            changes.push({ label: 'Name', before: before.name, after: after.name });
        }
        if (before.breed !== after.breed) {
            changes.push({ label: 'Breed', before: before.breed, after: after.breed });
        }
        if (before.reason !== after.reason) {
            changes.push({ label: 'Reason', before: before.reason, after: after.reason });
        }
        if (before.vet !== after.vet) {
            changes.push({ label: 'Vet', before: before.vet, after: after.vet });
        }
        if (before.status !== after.status) {
            changes.push({ label: 'Status', before: before.status, after: after.status });
        }
        if (before.owner !== after.owner) {
            changes.push({ label: 'Owner', before: before.owner, after: after.owner });
        }
        if (before.checkIn !== after.checkIn) {
            changes.push({ label: 'Check-In', before: before.checkIn, after: after.checkIn });
        }
        if (before.nextAppointment !== after.nextAppointment) {
            changes.push({ label: 'Next Appointment', before: before.nextAppointment, after: after.nextAppointment });
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

    // Standard client-side validator to disable Save if any text fields are empty.
    canSave(): boolean {
        if (!this.editDraft) return false;
        return (this.editDraft.name?.trim() ?? '').length > 0
            && (this.editDraft.breed?.trim() ?? '').length > 0
            && (this.editDraft.owner?.trim() ?? '').length > 0
            && (this.editDraft.reason?.trim() ?? '').length > 0
            && (this.editDraft.checkIn?.trim() ?? '').length > 0
            && (this.editDraft.vet?.trim() ?? '').length > 0
            && (this.editDraft.nextAppointment?.trim() ?? '').length > 0;
    }

    save(): void {
        if (!this.canSave()) {
            return;
        }
        // Close the dialog and pass the saved cat draft back.
        this.dialogRef.close({
            action: 'save',
            cat: {
                ...this.editDraft,
                name: (this.editDraft.name ?? '').trim(),
                breed: (this.editDraft.breed ?? '').trim(),
                owner: (this.editDraft.owner ?? '').trim(),
                reason: (this.editDraft.reason ?? '').trim(),
                checkIn: (this.editDraft.checkIn ?? '').trim(),
                vet: (this.editDraft.vet ?? '').trim(),
                nextAppointment: (this.editDraft.nextAppointment ?? '').trim()
            }
        });
    }

    delete(): void {
        // Open the native HTML delete dialog and wait for confirmation.
        this.confirmDeleteWithHtmlDialog().then((isConfirmed) => {
            if (isConfirmed) {
                // Close the dialog and pass 'delete' action back.
                this.dialogRef.close({
                    action: 'delete',
                    cat: this.editDraft
                });
            }
        });
    }

    cancel(): void {
        // If there are unsaved changes, prompt the user with the native HTML dialog first.
        if (this.hasUnsavedChanges()) {
            this.confirmDiscardWithHtmlDialog().then(discard => {
                if (discard) {
                    this.dialogRef.close();
                }
            });
            return;
        }
        // Close the dialog without passing any result (undefined).
        this.dialogRef.close();
    }
}
