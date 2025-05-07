import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffFlagsComponent } from './staff-flags.component';

describe('StaffFlagsComponent', () => {
  let component: StaffFlagsComponent;
  let fixture: ComponentFixture<StaffFlagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffFlagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
