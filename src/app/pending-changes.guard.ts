import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ModalHistoryService } from './modal-history.service';

/**
 * Guard that prevents navigation if there are unsaved changes in any open modal.
 * This covers internal Angular router navigation (e.g., clicking on menu links).
 */
export const pendingChangesGuard: CanDeactivateFn<unknown> = () => {
    const modalHistory = inject(ModalHistoryService);

    if (modalHistory.hasAnyUnsavedChanges()) {
        // If the browser back button was pressed, the ModalHistoryService
        // is already handling the dismissal and will show its own custom 
        // confirmation modal. We RETURN FALSE here to prevent the router 
        // from changing the page while the custom confirmation is visible.
        if (modalHistory.isPopStateInProgress()) {
            return false;
        }

        const confirmResult = confirm('You have unsaved changes in an open modal. Are you sure you want to leave this page?');
        if (!confirmResult) {
            return false;
        }

        // If the user chooses to leave anyway, we should clear the modal stack
        // and its history entries, or just let the page reload/navigation happen.
        // For router navigation, the modals will be destroyed as their parent components are destroyed.
    }

    return true;
};
