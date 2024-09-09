import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaginationPipe} from './pagination/pagination.pipe';
import { ProfilePicturePipe } from './profilePicture/profilePicture.pipe';
import { TruncatePipe } from './truncate/truncate.pipe';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        PaginationPipe,
        ProfilePicturePipe,
        TruncatePipe,
    ],
    exports: [
        PaginationPipe,
        ProfilePicturePipe,
        TruncatePipe
    ]
})
export class PipesModule { }
