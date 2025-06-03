import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyInformationComponent } from './emergency-information.component';

describe('EmergencyInformationComponent', () => {
  let component: EmergencyInformationComponent;
  let fixture: ComponentFixture<EmergencyInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyInformationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
