import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { disk_space } from '@data/dashboard-data';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-disk-space',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatCheckboxModule,
    NgxChartsModule
  ],
  templateUrl: './disk-space.component.html'
})
export class DiskSpaceComponent implements OnInit {
  public data: any[]; 
  public showLegend = false;
  public gradient = true;
  public colorScheme: any = {
    domain: ['#2F3E9E', '#D22E2E', '#378D3B']
  }; 
  public showLabels = true;
  public explodeSlices = true;
  public doughnut = false; 
  @ViewChild('resizedDiv') resizedDiv: ElementRef;
  public previousWidthOfResizedDiv:number = 0; 
  
  constructor() { }

  ngOnInit(){
    this.data = disk_space;  
  }
  
  public onSelect(event: any) {
    console.log(event);
  }

  ngAfterViewChecked() {    
    if(this.previousWidthOfResizedDiv != this.resizedDiv.nativeElement.clientWidth){
      setTimeout(() => this.data = [...disk_space] );
    }
    this.previousWidthOfResizedDiv = this.resizedDiv.nativeElement.clientWidth;
  }

}
