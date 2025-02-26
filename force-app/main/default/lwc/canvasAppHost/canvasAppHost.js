import { LightningElement } from 'lwc';

export default class VfCanvasWrapper extends LightningElement {
    vfPageUrl = '/apex/CanvasNodeApp'; // VF Page Name

    handleLoad() {
        console.log('Visualforce Page Loaded Successfully');
    }
}