import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable() 
export class CustomOverlayContainer extends OverlayContainer {
  override _createContainer(): void {
    let container = document.createElement('div');
    container.classList.add('cdk-overlay-container');
    if (document.getElementById('app')) {
      document.getElementById('app')!.appendChild(container);
    }
    this._containerElement = container;
  }
}