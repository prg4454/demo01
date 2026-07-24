import { Injectable } from '@angular/core';

export interface SelectedCompany {
    companyId: number | string;
    companyName: string;
}

@Injectable({
    providedIn: 'root'
})
export class SelectedCompanyService {
    private selectedCompany: SelectedCompany | null = null;

    setSelectedCompany(company: SelectedCompany): void {
        this.selectedCompany = company;
    }

    getSelectedCompany(): SelectedCompany | null {
        return this.selectedCompany;
    }

    clearSelectedCompany(): void {
        this.selectedCompany = null;
    }
}
