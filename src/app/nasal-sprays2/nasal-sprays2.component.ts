import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../storage.service';
// Import CDK Dialog services
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { NasalSprays2EditComponent, type NasalSpray2Record, type NasalSprays2EditResult, type NasalSprays2EditData } from './nasal-sprays2-edit.component';

export type { NasalSpray2Record, NasalSprays2EditResult, NasalSprays2EditData };

@Component({
    selector: 'app-nasal-sprays2',
    standalone: true,
    imports: [CommonModule, DialogModule],
    templateUrl: './nasal-sprays2.component.html',
    styleUrl: './nasal-sprays2.component.scss'
})
export class NasalSprays2Component implements OnInit, OnDestroy {
    // 1. Inject the Angular CDK Dialog service to manage modal overlay views.
    private dialog = inject(Dialog);
    private storageService = inject(StorageService);

    // Keep track of the currently opened dialog reference to check for unsaved changes.
    activeDialogRef: DialogRef<NasalSprays2EditResult, NasalSprays2EditComponent> | null = null;

    readonly pageSize = 8;
    currentPage = signal(1);

    nasalSprays = signal<NasalSpray2Record[]>([]);

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
        const count = await this.storageService.getCount('nasalSprays2');
        if (count === 0) {
            // Generate exactly 20 sample mock nasal sprays if none exist.
            const initialSprays = this.generateNasalSprays(20);
            await this.storageService.saveAll('nasalSprays2', initialSprays);
        }
        const allSprays = await this.storageService.getAll<NasalSpray2Record>('nasalSprays2');
        allSprays.sort((a, b) => b.id - a.id);
        this.nasalSprays.set(allSprays);
    }

    private generateNasalSprays(count: number): NasalSpray2Record[] {
        const brandNames = ['Flonase', 'Afrin', 'Ayr Saline', 'Nasacort', 'Astelin', 'Rhinocort', 'Simply Saline', 'Dymista', 'Mucinex Sinus-Max', 'Xlear', 'Zicam', 'NeilMed'];
        const genericNames = ['Fluticasone Propionate', 'Oxymetazoline', 'Sodium Chloride', 'Triamcinolone Acetonide', 'Azelastine', 'Budesonide', 'Saline Solution', 'Azelastine/Fluticasone'];
        const strengths = ['50 mcg/spray', '0.05%', '0.65%', '55 mcg/spray', '137 mcg/spray', '32 mcg/spray', '0.9%', '0.75%'];
        const categories: NasalSpray2Record['category'][] = ['Steroid', 'Saline', 'Antihistamine', 'Decongestant'];
        const doses = ['2 sprays each nostril daily', '2 sprays each nostril every 12 hours', '1 to 2 sprays as needed', '1 spray each nostril twice daily', 'As needed'];
        const usages = ['Seasonal allergy control', 'Short-term congestion relief', 'Moisturize dry nasal passages', 'Allergy symptom prevention', 'Itchy nose and sneezing', 'Long-term allergy management'];
        const manufacturers = ['GSK', 'Bayer', 'B.F. Ascher', 'Sanofi', 'Meda', 'AstraZeneca', 'Arm & Hammer', 'Glenmark'];

        return Array.from({ length: count }, (_, i) => ({
            id: 3001 + i,
            brandName: brandNames[Math.floor(Math.random() * brandNames.length)] + ' ' + (i + 1),
            genericName: genericNames[Math.floor(Math.random() * genericNames.length)],
            strength: strengths[Math.floor(Math.random() * strengths.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            dose: doses[Math.floor(Math.random() * doses.length)],
            usage: usages[Math.floor(Math.random() * usages.length)],
            comments: `Sample comment ${i + 1}`,
            manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
            lastOpened: `2026-0${7 + Math.floor(Math.random() * 2)}-${String(10 + Math.floor(Math.random() * 20)).padStart(2, '0')}`
        }));
    }

    totalSprays = computed(() => this.nasalSprays().length);

    totalPages = computed(() => {
        return Math.max(1, Math.ceil(this.nasalSprays().length / this.pageSize));
    });

    pagedSprays = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize;
        return this.nasalSprays().slice(start, start + this.pageSize);
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

    // 3. Open the edit dialog when a spray brand name is clicked.
    openEditModal(spray: NasalSpray2Record): void {
        // Open the dialog overlay, configure width, disable backdrop dismissal, and pass DIALOG_DATA.
        const dialogRef = this.dialog.open<NasalSprays2EditResult, NasalSprays2EditData, NasalSprays2EditComponent>(NasalSprays2EditComponent, {
            width: '550px',
            disableClose: true, // Prevents closing the dialog by clicking outside the backdrop or hitting ESC.
            closeOnNavigation: false, // Prevent the dialog from auto-closing before the CanDeactivate guard runs.
            data: {
                spray: spray,
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
                await this.storageService.save('nasalSprays2', result.spray);
                this.nasalSprays.update(current => {
                    const idx = current.findIndex(c => c.id === result.spray.id);
                    if (idx !== -1) {
                        const updated = [...current];
                        updated[idx] = result.spray;
                        return updated;
                    }
                    return current;
                });
            } else if (result.action === 'delete') {
                // Delete record from IndexedDB.
                await this.storageService.delete('nasalSprays2', result.spray.id);
                this.nasalSprays.update(current => current.filter(c => c.id !== result.spray.id));
                // Recalculate page boundaries if we deleted the last item on the current page.
                if (this.currentPage() > this.totalPages()) {
                    this.currentPage.set(this.totalPages());
                }
            }
        });
    }

    // 4. Open the add dialog to create a new nasal spray record.
    openAddModal(): void {
        const newSpray: NasalSpray2Record = {
            id: this.getNextId(),
            brandName: '',
            genericName: '',
            strength: '',
            category: 'Steroid',
            dose: '',
            usage: '',
            comments: '',
            manufacturer: '',
            lastOpened: ''
        };

        const dialogRef = this.dialog.open<NasalSprays2EditResult, NasalSprays2EditData, NasalSprays2EditComponent>(NasalSprays2EditComponent, {
            width: '550px',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                spray: newSpray,
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
            await this.storageService.save('nasalSprays2', result.spray);
            this.nasalSprays.update(current => [result.spray, ...current]);
            this.currentPage.set(1); // Navigate to page 1 to see the new spray
        });
    }

    private getNextId(): number {
        return this.nasalSprays().length > 0 ? Math.max(...this.nasalSprays().map(c => c.id)) + 1 : 3000;
    }

    ngOnDestroy(): void {
        if (this.activeDialogRef) {
            this.activeDialogRef.close();
        }
    }
}
