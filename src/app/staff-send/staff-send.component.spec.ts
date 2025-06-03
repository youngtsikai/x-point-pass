import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSendComponent } from './staff-send.component';

describe('StaffSendComponent', () => {
  let component: StaffSendComponent;
  let fixture: ComponentFixture<StaffSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffSendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
