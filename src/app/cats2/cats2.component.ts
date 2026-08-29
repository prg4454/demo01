import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../storage.service';
// Import CDK Dialog services
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import type { Cats2EditComponent, CatRecord, Cats2EditResult, Cats2EditData } from './cats2-edit.component';

export type { CatRecord, Cats2EditResult, Cats2EditData };

@Component({
    selector: 'app-cats2',
    standalone: true,
    imports: [CommonModule, DialogModule],
    templateUrl: './cats2.component.html',
    styleUrl: './cats2.component.scss'
})
export class Cats2Component implements OnInit, OnDestroy {
    // 1. Inject the Angular CDK Dialog service to manage modal overlay views.
    private dialog = inject(Dialog);
    private storageService = inject(StorageService);

    // Keep track of the currently opened dialog reference to check for unsaved changes.
    activeDialogRef: DialogRef<Cats2EditResult, Cats2EditComponent> | null = null;

    readonly pageSize = 8;
    currentPage = signal(1);

    cats = signal<CatRecord[]>([]);

    async ngOnInit() {
        await this.loadData();
    }

    // 2. Custom check used by the pendingChangesGuard when navigating away or clicking browser back.
    hasUnsavedChanges(): boolean {
        const comp = this.activeDialogRef?.componentInstance;
        return !!comp && typeof comp.hasUnsavedChanges === 'function' && comp.hasUnsavedChanges();
    }

    canDeactivate(): boolean | Promise<boolean> {
        const comp = this.activeDialogRef?.componentInstance;
        if (comp && typeof comp.hasUnsavedChanges === 'function' && comp.hasUnsavedChanges()) {
            // Open the native HTML dialog in the child component and return the result promise
            return comp.confirmDiscardWithHtmlDialog();
        }
        return true;
    }

    private async loadData() {
        // Retrieve standard records from IndexedDB storage.
        let count = await this.storageService.getCount('cats2');
        if (count === 0 || count === 24) {
            // Reset existing records to change default count to exactly 20.
            const all = await this.storageService.getAll<CatRecord>('cats2');
            for (const c of all) {
                await this.storageService.delete('cats2', c.id);
            }
            // Generate exactly 20 sample mock cats if none or the previous 24 exist.
            const initialCats = this.generateCats(20);
            await this.storageService.saveAll('cats2', initialCats);
        }
        const allCats = await this.storageService.getAll<CatRecord>('cats2');
        allCats.sort((a, b) => b.id - a.id);
        this.cats.set(allCats);
    }

    private generateCats(count: number): CatRecord[] {
        const breeds = ['Siamese', 'Persian', 'Maine Coon', 'Bengal', 'Sphynx', 'Abyssinian', 'Ragdoll'];
        const owners = ['Miller', 'Johnson', 'Nguyen', 'Garcia', 'Taylor', 'Lee', 'Smith', 'Davis'];
        const reasons = ['Annual checkup', 'Ear infection', 'Vaccinations', 'Limping front paw', 'Skin irritation', 'Nail trim'];
        const vets = ['Dr. Hernandez', 'Dr. Patel', 'Dr. Kim', 'Dr. Adams'];
        const names = ['Luna', 'Milo', 'Oliver', 'Leo', 'Loki', 'Bella', 'Charlie', 'Willow', 'Lucy', 'Simba'];
        const statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

        return Array.from({ length: count }, (_, i) => ({
            id: 2001 + i,
            name: names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1),
            breed: breeds[Math.floor(Math.random() * breeds.length)],
            owner: owners[Math.floor(Math.random() * owners.length)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            checkIn: `${8 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6)}0 AM`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            vet: vets[Math.floor(Math.random() * vets.length)],
            nextAppointment: `2026-09-${10 + Math.floor(Math.random() * 20)}`
        }));
    }

    totalCats = computed(() => this.cats().length);

    totalPages = computed(() => {
        return Math.max(1, Math.ceil(this.cats().length / this.pageSize));
    });

    pagedCats = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize;
        return this.cats().slice(start, start + this.pageSize);
    });

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
        }
    }

    // 3. Open the edit dialog when a cat name is clicked.
    async openEditModal(cat: CatRecord): Promise<void> {
        const { Cats2EditComponent } = await import('./cats2-edit.component');
        // Open the dialog overlay, configure width, disable backdrop dismissal, and pass DIALOG_DATA.
        const dialogRef = this.dialog.open<Cats2EditResult, Cats2EditData, Cats2EditComponent>(Cats2EditComponent, {
            width: '550px',
            disableClose: true, // Prevents closing the dialog by clicking outside the backdrop or hitting ESC.
            closeOnNavigation: false, // Prevent the dialog from auto-closing before the CanDeactivate guard runs.
            data: {
                cat: cat,
                allowDelete: true
            }
        });
        this.activeDialogRef = dialogRef;

        // Subscribe to the closed observable to handle the results (save, delete, or cancel).
        dialogRef.closed.subscribe(async (result) => {
            this.activeDialogRef = null;

            if (!result) {
                return; // User cancelled editing (closed dialog without save/delete result payload).
            }

            if (result.action === 'save') {
                // Save updated record back to IndexedDB.
                await this.storageService.save('cats2', result.cat);
                this.cats.update(current => {
                    const idx = current.findIndex(c => c.id === result.cat.id);
                    if (idx !== -1) {
                        const updated = [...current];
                        updated[idx] = result.cat;
                        return updated;
                    }
                    return current;
                });
            } else if (result.action === 'delete') {
                // Delete record from IndexedDB.
                await this.storageService.delete('cats2', result.cat.id);
                this.cats.update(current => current.filter(c => c.id !== result.cat.id));
                // Recalculate page boundaries if we deleted the last item on the current page.
                if (this.currentPage() > this.totalPages()) {
                    this.currentPage.set(this.totalPages());
                }
            }
        });
    }

    // 4. Open the add dialog to create a new cat record.
    async openAddModal(): Promise<void> {
        const { Cats2EditComponent } = await import('./cats2-edit.component');
        const newCat: CatRecord = {
            id: this.getNextId(),
            name: '',
            breed: '',
            owner: '',
            reason: '',
            checkIn: '',
            status: 'Waiting',
            vet: '',
            nextAppointment: ''
        };

        const dialogRef = this.dialog.open<Cats2EditResult, Cats2EditData, Cats2EditComponent>(Cats2EditComponent, {
            width: '550px',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                cat: newCat,
                allowDelete: false
            }
        });
        this.activeDialogRef = dialogRef;

        dialogRef.closed.subscribe(async (result) => {
            this.activeDialogRef = null;

            if (!result || result.action !== 'save') {
                return; // User cancelled adding
            }

            // Save new record to IndexedDB
            await this.storageService.save('cats2', result.cat);
            this.cats.update(current => [result.cat, ...current]);
            this.currentPage.set(1); // Navigate to page 1 to see the new cat
        });
    }

    private getNextId(): number {
        return this.cats().length > 0 ? Math.max(...this.cats().map(c => c.id)) + 1 : 2000;
    }

    ngOnDestroy(): void {
        if (this.activeDialogRef) {
            this.activeDialogRef.close();
        }
    }
}
