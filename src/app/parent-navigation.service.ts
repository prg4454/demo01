import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Dialog } from '@angular/cdk/dialog';

@Injectable({
    providedIn: 'root'
})
export class ParentNavigationService {
    private router = inject(Router);
    private ngbModal = inject(NgbModal);
    private cdkDialog = inject(Dialog);

    // Holds the designated parent/root route
    private parentRoute = signal<string | null>(null);

    /**
     * Set the parent/root route.
     * If no route is passed, it uses the current active router URL.
     */
    setParentPage(route?: string): void {
        const target = route ?? this.router.url;
        this.parentRoute.set(target);
    }

    /**
     * Clear the parent/root route.
     */
    clearParentPage(): void {
        this.parentRoute.set(null);
    }

    /**
     * Get the current designated parent/root route.
     */
    getParentPage(): string | null {
        return this.parentRoute();
    }

    /**
     * Check if a parent/root route is currently registered.
     */
    hasParentPage(): boolean {
        return this.parentRoute() !== null;
    }

    /**
     * Universally checks if any modal is currently open:
     * - NgbModal (Bootstrap)
     * - Angular CDK Dialog
     * - Native HTML5 <dialog> elements
     * - Global DOM modal/overlay containers
     */
    isAnyModalOpen(): boolean {
        // 1. Check Bootstrap NgbModal service
        if (this.ngbModal.hasOpenModals()) {
            return true;
        }

        // 2. Check Angular CDK Dialog service
        if (this.cdkDialog.openDialogs.length > 0) {
            return true;
        }

        // 3. Check for Native HTML5 <dialog> elements and DOM overlays
        if (typeof document !== 'undefined') {
            const hasNativeOpen = document.querySelectorAll('dialog[open]').length > 0;
            const hasBootstrapOrOverlay = document.querySelector('.modal.show, .cdk-overlay-pane') !== null;
            if (hasNativeOpen || hasBootstrapOrOverlay) {
                return true;
            }
        }

        return false;
    }

    /**
     * If all modals are closed and a parent route is set,
     * navigates the user back to the parent route.
     * Returns true if navigation was initiated, false otherwise.
     */
    async returnToParentIfAllClosed(clearAfterNavigate = true): Promise<boolean> {
        const target = this.parentRoute();
        if (!target) {
            return false;
        }

        if (this.isAnyModalOpen()) {
            return false;
        }

        if (clearAfterNavigate) {
            this.clearParentPage();
        }

        return await this.router.navigateByUrl(target);
    }

    /**
     * Closes all open modals (NgbModal, CDK Dialogs, and Native <dialog> elements)
     * and immediately navigates back to the designated parent route.
     */
    async closeAllModalsAndReturnToParent(clearAfterNavigate = true): Promise<boolean> {
        const target = this.parentRoute();
        if (!target) {
            return false;
        }

        // Close NgbModals
        this.ngbModal.dismissAll('parent-navigation');

        // Close CDK Dialogs
        this.cdkDialog.closeAll();

        // Close Native <dialog> elements
        if (typeof document !== 'undefined') {
            const nativeDialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]');
            nativeDialogs.forEach(dialog => dialog.close());
            document.body.style.overflow = '';
        }

        if (clearAfterNavigate) {
            this.clearParentPage();
        }

        return await this.router.navigateByUrl(target);
    }
}

