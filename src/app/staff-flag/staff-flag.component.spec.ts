import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffFlagComponent } from './staff-flag.component';

describe('StaffFlagComponent', () => {
  let component: StaffFlagComponent;
  let fixture: ComponentFixture<StaffFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffFlagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
