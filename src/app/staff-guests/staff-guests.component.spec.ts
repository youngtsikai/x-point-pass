import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffGuestsComponent } from './staff-guests.component';

describe('StaffGuestsComponent', () => {
  let component: StaffGuestsComponent;
  let fixture: ComponentFixture<StaffGuestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffGuestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffGuestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
