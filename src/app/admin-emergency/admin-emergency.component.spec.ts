import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEmergencyComponent } from './admin-emergency.component';

describe('AdminEmergencyComponent', () => {
  let component: AdminEmergencyComponent;
  let fixture: ComponentFixture<AdminEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
