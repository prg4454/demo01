import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ModalDismissGuard {
    async handleBeforeDismiss(component: any): Promise<boolean> {
        if (component && typeof component.handleBeforeDismiss === 'function') {
            return await component.handleBeforeDismiss();
        }
        return true;
    }
}
