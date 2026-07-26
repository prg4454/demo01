import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import {
    NasalSprayRecord,
    NasalSpraysEntryModalComponent,
    NasalSpraysModalResult
} from './nasal-sprays-entry-modal.component';

@Component({
    selector: 'app-nasal-sprays',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbModalModule],
    templateUrl: './nasal-sprays.component.html',
    styleUrl: './nasal-sprays.component.scss'
})
export class NasalSpraysComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    showComments = false;

    nasalSprays: NasalSprayRecord[] = [
        { id: 1, brandName: 'Flonase', genericName: 'Fluticasone Propionate', strength: '50 mcg/spray', category: 'Steroid', dose: '2 sprays each nostril daily', usage: 'Seasonal allergy control', comments: 'Morning use works best for this one.', manufacturer: 'GSK', lastOpened: '2026-07-08' },
        { id: 2, brandName: 'Afrin', genericName: 'Oxymetazoline', strength: '0.05%', category: 'Decongestant', dose: '2 sprays each nostril every 12 hours', usage: 'Short-term congestion relief', comments: 'Do not use for more than three days in a row.', manufacturer: 'Bayer', lastOpened: '2026-06-30' },
        { id: 3, brandName: 'Ayr Saline', genericName: 'Sodium Chloride', strength: '0.65%', category: 'Saline', dose: '1 to 2 sprays as needed', usage: 'Moisturize dry nasal passages', comments: 'Gentle option for frequent use.', manufacturer: 'B.F. Ascher', lastOpened: '2026-07-15' },
        { id: 4, brandName: 'Nasacort', genericName: 'Triamcinolone Acetonide', strength: '55 mcg/spray', category: 'Steroid', dose: '2 sprays each nostril daily', usage: 'Allergy symptom prevention', comments: 'Good for consistent daily routines.', manufacturer: 'Sanofi', lastOpened: '2026-07-01' },
        { id: 5, brandName: 'Astelin', genericName: 'Azelastine', strength: '137 mcg/spray', category: 'Antihistamine', dose: '1 to 2 sprays each nostril twice daily', usage: 'Itchy nose and sneezing', comments: 'Can be a bit bitter after use.', manufacturer: 'Meda', lastOpened: '2026-06-22' },
        { id: 6, brandName: 'Rhinocort', genericName: 'Budesonide', strength: '32 mcg/spray', category: 'Steroid', dose: '2 sprays each nostril daily', usage: 'Long-term allergy management', comments: 'Often chosen for maintenance therapy.', manufacturer: 'AstraZeneca', lastOpened: '2026-07-12' },
        { id: 7, brandName: 'Simply Saline', genericName: 'Saline Solution', strength: '0.9%', category: 'Saline', dose: 'As needed', usage: 'Rinse and refresh nasal passages', comments: 'Works well before other nasal medicines.', manufacturer: 'Arm & Hammer', lastOpened: '2026-07-18' },
        { id: 8, brandName: 'Dymista', genericName: 'Azelastine/Fluticasone', strength: '137 mcg / 50 mcg', category: 'Antihistamine', dose: '1 spray each nostril twice daily', usage: 'Combined allergy control', comments: 'Two active ingredients in one bottle.', manufacturer: 'Glenmark', lastOpened: '2026-06-27' },
        { id: 9, brandName: 'Mucinex Sinus-Max', genericName: 'Oxymetazoline', strength: '0.05%', category: 'Decongestant', dose: '2 sprays each nostril every 10 hours', usage: 'Temporary stuffy nose relief', comments: 'Use sparingly to avoid rebound congestion.', manufacturer: 'RB Health', lastOpened: '2026-07-05' },
        { id: 10, brandName: 'Xlear', genericName: 'Xylitol Saline', strength: '0.75%', category: 'Saline', dose: '2 to 4 sprays as needed', usage: 'Hydrate and clear nasal passages', comments: 'Popular for dry air and travel days.', manufacturer: 'Xlear Inc.', lastOpened: '2026-07-20' }
    ];

    openEditModal(spray: NasalSprayRecord): void {
        const modalRef = this.modalService.open(NasalSpraysEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);
        modalRef.componentInstance.spray = structuredClone(spray);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: NasalSpraysModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'save') {
                    this.nasalSprays = this.nasalSprays.map(existing => existing.id === result.spray.id ? result.spray : existing);
                    return;
                }

                this.nasalSprays = this.nasalSprays.filter(existing => existing.id !== result.spray.id);
            })
            .catch(() => undefined);
    }
}
