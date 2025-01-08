/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from '@services/company.service';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Company } from '../../../common/interfaces/company';


@Component({
  selector: 'app-company-detailed',
  standalone: true,
  imports: [MatListModule, RouterModule, MatCardModule, MatIconModule],
  templateUrl: './company-detailed.component.html',
  styleUrl: './company-detailed.component.scss'
})
export class CompanyDetailedComponent {
  shippingDetails: any;
  bankDetails: any;
  companyService=inject(CompanyService)
  route=inject(ActivatedRoute)
  dialog=inject(MatDialog)
 

  panelOpenState = false;




  ngOnInit(): void {

    this.getCompanyInfo()
  }

  company :Company


  getCompanyInfo(){

    const id = this.route.snapshot.paramMap.get('id');

  if (id !== null) {
    this.companyService.getCompanyInfo(id).subscribe(
      (response:any) => {
        this.company = response;

      },
      (error) => {
        console.log('An error occurred while fetching data:', error);
      }
    );
  }
  }
}
