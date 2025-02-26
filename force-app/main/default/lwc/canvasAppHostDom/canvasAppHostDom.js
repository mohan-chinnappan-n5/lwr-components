
import { LightningElement } from 'lwc';

export default class CanvasAppHostDom extends LightningElement {
    connectedCallback() {
        this.embedVisualforcePage();
    }

    embedVisualforcePage() {
        const container = this.template.querySelector('[data-id="vfContainer"]');

        if (container) {
            const iframe = document.createElement('iframe');
            iframe.src = '/apex/CanvasNodeApp'; // Your VF page
            iframe.classList.add('iframe-content');

            // Set iframe attributes
            iframe.setAttribute('width', '100%');
            iframe.setAttribute('height', '500px');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('scrolling', 'auto');

            container.innerHTML = ''; // Clear previous content
            container.appendChild(iframe);
        }
    }
}