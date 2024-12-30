import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  heading: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { action: string, leaveId: string, heading: string },
  public dialogRef: MatDialogRef<NoteDialogComponent>) {
this.heading = data.heading;
}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
