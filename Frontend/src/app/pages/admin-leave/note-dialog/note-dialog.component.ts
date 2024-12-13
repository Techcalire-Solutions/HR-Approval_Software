import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { matFormFieldAnimations, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-note-dialog',
  standalone: true,
  imports: [MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,

  ],
  templateUrl: './note-dialog.component.html',
  styleUrl: './note-dialog.component.scss'
})
export class NoteDialogComponent {
  note: string = '';

  constructor(public dialogRef: MatDialogRef<NoteDialogComponent>) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

}
