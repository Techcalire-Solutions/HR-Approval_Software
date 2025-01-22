/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { Assets } from '../../common/interfaces/assets/assets';
import { AssetsService } from '@services/assets.service';
import { CommonModule } from '@angular/common';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddAssetsComponent } from './add-assets/add-assets.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [ MatButtonToggleModule, MatIconModule, MatFormFieldModule, CommonModule, MatInputModule, MatButtonModule, MatPaginatorModule],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss'
})
export class AssetsComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getAssets();
  }
  
  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getAssets()
  }


  private assetSub!: Subscription;
  private readonly assetService = inject(AssetsService);
  assets: Assets[] = [];
  getAssets(){
    this.assetSub = this.assetService.getAssets(this.searchText, this.currentPage, this.pageSize).subscribe((asset: any) => {
      this.assets = asset.items;
      this.fetchAssignedUsers(this.assets);
      
      this.totalItems = asset.count;
    })
  }

  openDialog(asset: Assets | null) {
    const dialogRef = this.dialog.open(AddAssetsComponent, {
      data: asset
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getAssets()
    });
  }

  private deleteSub!: Subscription;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  delete(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.deleteSub = this.assetService.deleteAssets(id).subscribe(() => {
          this.snackBar.open("Asset deleted successfully...","" ,{duration:3000})
          this.getAssets()
        });
      }
    });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getAssets();
  }

  assignedUsers: { [assetId: number]: number | null } = {};
  fetchAssignedUsers(assetList: Assets[]): void {
    assetList.forEach((asset) => {
      if (asset.assignedStatus) {
        this.assetService.getAssignedUsers(asset.id).subscribe(
          (response: any) => {
            this.assignedUsers[asset.id] = response.userId;
            console.log(response);
            
          },
          (error) => {
            console.error(`Error fetching user for asset ID ${asset.id}:`, error);
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.assetSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
  }

}
