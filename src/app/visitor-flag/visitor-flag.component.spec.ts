import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorFlagComponent } from './visitor-flag.component';

describe('VisitorFlagComponent', () => {
  let component: VisitorFlagComponent;
  let fixture: ComponentFixture<VisitorFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorFlagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
