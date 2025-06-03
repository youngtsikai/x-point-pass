import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorEmergencyComponent } from './visitor-emergency.component';

describe('VisitorEmergencyComponent', () => {
  let component: VisitorEmergencyComponent;
  let fixture: ComponentFixture<VisitorEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
