import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './services.component.html',
    styleUrl: './services.component.scss'
})
export class ServicesComponent {
    services = [
        {
            icon: '🎨',
            title: 'Web Design',
            description: 'Create beautiful, responsive designs that engage your users'
        },
        {
            icon: '⚙️',
            title: 'Development',
            description: 'Build robust, scalable applications with modern technologies'
        },
        {
            icon: '🔧',
            title: 'Maintenance',
            description: 'Keep your applications running smoothly with ongoing support'
        },
        {
            icon: '📱',
            title: 'Mobile Apps',
            description: 'Develop cross-platform mobile applications'
        },
        {
            icon: '🔒',
            title: 'Security',
            description: 'Protect your data with industry-leading security practices'
        },
        {
            icon: '📊',
            title: 'Analytics',
            description: 'Gain insights with data-driven analytics and reporting'
        }
    ];
}
