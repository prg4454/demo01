import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type MenuLinkItem = { label: string; path: string };
type MenuItem = { label: string; path?: string; subItems?: MenuLinkItem[] };

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {
    isMenuOpen = false;
    expandedMenuIndex: number | null = null;

    constructor(private elementRef: ElementRef<HTMLElement>) { }

    menuItems: MenuItem[] = [
        { label: 'Home', path: '/home' },
        { label: 'About', path: '/about' },
        { label: 'Services', path: '/services' },
        {
            label: 'Misc',
            subItems: [
                { label: 'Silly Sayings', path: '/sayings' },
                { label: 'Jokes', path: '/jokes' },
                { label: 'Address Book', path: '/address-book' },
                { label: 'Automobiles', path: '/automobiles' }
            ]
        },
        {
            label: 'Pets',
            subItems: [
                { label: 'Cats', path: '/cats' },
                { label: 'Dogs', path: '/dogs' }
            ]
        },
        { label: 'Contact', path: '/contact' }
    ];

    get activeSubItems(): MenuLinkItem[] {
        if (this.expandedMenuIndex === null) {
            return [];
        }

        const item = this.menuItems[this.expandedMenuIndex];
        return item?.subItems ?? [];
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleSubmenu(index: number, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Keep only one submenu expanded at a time.
        if (this.expandedMenuIndex === index) {
            this.expandedMenuIndex = null;
            return;
        }

        this.expandedMenuIndex = index;
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.expandedMenuIndex = null;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const hostElement = this.elementRef.nativeElement;

        if (!hostElement.contains(target)) {
            this.expandedMenuIndex = null;
        }
    }
}
