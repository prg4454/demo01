import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {
    isMenuOpen = false;
    expandedItems: { [key: string]: boolean } = {};
    @ViewChild('navBar') navBar!: ElementRef;

    menuItems = [
        { label: 'Home', path: '/home' },
        { label: 'About', path: '/about' },
        { label: 'Services', path: '/services' },
        {
            label: 'Misc',
            subItems: [
                { label: 'Silly Sayings', path: '/sayings' },
                { label: 'Jokes', path: '/jokes' },
                { label: 'Address Book', path: '/address-book' }
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

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleSubmenu(item: any) {
        const key = item.label;
        this.expandedItems[key] = !this.expandedItems[key];
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.expandedItems = {};
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const navElement = document.querySelector('nav.navbar');

        if (navElement && !navElement.contains(target)) {
            this.expandedItems = {};
        }
    }
}
