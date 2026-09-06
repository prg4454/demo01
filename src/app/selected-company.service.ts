import { Injectable } from '@angular/core';

export interface SelectedCompany {
    companyId: number | string;
    companyName: string;
}

@Injectable({
    providedIn: 'root'
})
export class SelectedCompanyService {
    private static readonly STORAGE_KEY = 'selected_company';
    private selectedCompany: SelectedCompany | null = null;

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem(SelectedCompanyService.STORAGE_KEY);
                if (stored) {
                    this.selectedCompany = JSON.parse(stored);
                }
            }
        } catch (e) {
            console.error('Failed to load selected company from storage', e);
        }
    }

    setSelectedCompany(company: SelectedCompany): void {
        this.selectedCompany = company;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(SelectedCompanyService.STORAGE_KEY, JSON.stringify(company));
            }
        } catch (e) {
            console.error('Failed to save selected company to storage', e);
        }
    }

    getSelectedCompany(): SelectedCompany | null {
        return this.selectedCompany;
    }

    clearSelectedCompany(): void {
        this.selectedCompany = null;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(SelectedCompanyService.STORAGE_KEY);
            }
        } catch (e) {
            console.error('Failed to remove selected company from storage', e);
        }
    }
}
