import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hierarchy-tree-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hierarchy-tree-node.component.html',
  styleUrl: './hierarchy-tree-node.component.scss'
})
export class HierarchyTreeNodeComponent {
  @Input() parentId!: number;
  @Input() getChildren!: (id: number) => any[];

  // Function to recursively render child nodes
  getChildrenNodes() {
    return this.getChildren(this.parentId);
  }
}
