import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffVisitsComponent } from './staff-visits.component';

describe('StaffVisitsComponent', () => {
  let component: StaffVisitsComponent;
  let fixture: ComponentFixture<StaffVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffVisitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
