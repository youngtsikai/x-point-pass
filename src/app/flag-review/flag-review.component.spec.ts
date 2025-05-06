import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagReviewComponent } from './flag-review.component';

describe('FlagReviewComponent', () => {
  let component: FlagReviewComponent;
  let fixture: ComponentFixture<FlagReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlagReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlagReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
