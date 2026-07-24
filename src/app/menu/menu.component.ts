import { AfterViewInit, Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SelectedCompany, SelectedCompanyService } from '../selected-company.service';

type MenuLinkItem = { label: string; path: string };
type MenuItem = { label: string; path?: string; subItems?: MenuLinkItem[] };

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent implements AfterViewInit {
    isMenuOpen = false;
    expandedMenuIndex: number | null = null;

    @ViewChild('appNavbar') private appNavbar?: ElementRef<HTMLElement>;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private selectedCompanyService: SelectedCompanyService
    ) { }

    menuItems: MenuItem[] = [
        { label: 'Home', path: '/home' },
        { label: 'Services', path: '/services' },
        {
            label: 'Misc',
            subItems: [
                { label: 'Silly Sayings', path: '/sayings' },
                { label: 'Jokes', path: '/jokes' },
                { label: 'Address Book', path: '/address-book' },
                { label: 'Automobiles', path: '/automobiles' },
                { label: 'Cars in Shop', path: '/cars' },
                { label: 'Notebooks', path: '/notebooks' },
                { label: 'Medicines', path: '/medicines' },
                { label: 'Construction Skills', path: '/construction-skills' },
                { label: 'Friends', path: '/friends' }
            ]
        },
        {
            label: 'Misc2',
            subItems: [
                { label: 'UI Employer Tax', path: '/ui-employer-tax' },
                { label: 'Users', path: '/users' },
                { label: 'Company List', path: '/company-list' }
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

    get selectedCompany(): SelectedCompany | null {
        return this.selectedCompanyService.getSelectedCompany();
    }

    ngAfterViewInit(): void {
        this.updateStickyOffset();
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.deferStickyOffsetUpdate();
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
        this.deferStickyOffsetUpdate();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const hostElement = this.elementRef.nativeElement;

        if (!hostElement.contains(target)) {
            this.expandedMenuIndex = null;
            this.deferStickyOffsetUpdate();
        }
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.updateStickyOffset();
    }

    private deferStickyOffsetUpdate(): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.requestAnimationFrame(() => this.updateStickyOffset());
    }

    private updateStickyOffset(): void {
        if (typeof document === 'undefined') {
            return;
        }

        const navbar = this.appNavbar?.nativeElement;
        if (!navbar) {
            return;
        }

        const navbarRow = navbar.querySelector('.container-fluid') as HTMLElement | null;
        const measuredHeight = Math.ceil((navbarRow ?? navbar).getBoundingClientRect().height);
        const height = Math.min(84, Math.max(48, measuredHeight));
        document.documentElement.style.setProperty('--app-navbar-offset', `${height}px`);
    }
}
