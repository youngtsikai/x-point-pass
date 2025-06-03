import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEmergencyComponent } from './security-emergency.component';

describe('SecurityEmergencyComponent', () => {
  let component: SecurityEmergencyComponent;
  let fixture: ComponentFixture<SecurityEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
