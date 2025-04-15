import { NgStyle } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.scss',
})
export class CounterComponent {
  value = input.required<number>();
  valueStr = computed(() => this.value().toString().padStart(3, "0"));
}
